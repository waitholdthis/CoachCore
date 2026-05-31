import { useEffect, useRef, useCallback } from "react";
import type { WSEvent } from "./types";

export function createTeamSocket(teamId: string, token: string): WebSocket {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const url = `${protocol}//${host}/ws/teams/${teamId}?token=${encodeURIComponent(token)}`;
  return new WebSocket(url);
}

export function useTeamSocket(
  teamId: string | null,
  onEvent: (event: WSEvent) => void
): void {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backoffRef = useRef<number>(1000);
  const mountedRef = useRef<boolean>(true);
  const onEventRef = useRef(onEvent);

  // Keep onEvent ref up to date without causing re-connects
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current || !teamId) return;

    // Get token at connection time
    let token: string | null = null;
    try {
      token = localStorage.getItem("season_token");
    } catch {
      // ignore
    }
    if (!token) return;

    cleanup();

    const ws = createTeamSocket(teamId, token);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      backoffRef.current = 1000; // reset backoff on successful connect

      // Send pings every 30s
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(event.data) as WSEvent;
        onEventRef.current(data);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      // Exponential backoff reconnect, max 30s
      const delay = Math.min(backoffRef.current, 30000);
      backoffRef.current = Math.min(backoffRef.current * 2, 30000);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [teamId, cleanup]);

  useEffect(() => {
    mountedRef.current = true;
    backoffRef.current = 1000;

    if (teamId) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [teamId, connect, cleanup]);
}
