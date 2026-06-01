from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from models.resource import Resource


SEED_DATA = [
    # ── Tips ──────────────────────────────────────────────────────────────────
    {
        "title": "The 3-Second Rule for Defensive Positioning",
        "body": (
            "One of the most effective defensive principles you can teach young athletes is the 3-second rule: "
            "whenever the ball changes possession, every defender should find their assignment within three seconds. "
            "This habit eliminates the 'transition gap' — the window attackers exploit when defenses are still reacting.\n\n"
            "Drill this in practice by calling out 'reset!' at random moments during scrimmage and freezing the play. "
            "Walk through the field and point out every defender who doesn't have an eye on both their assignment and the ball. "
            "Repetition builds muscle memory, and within a few weeks your defense will recover automatically.\n\n"
            "The rule also teaches decision-making speed. Athletes who internalize a 3-second mental clock become better readers "
            "of the game overall, because they're trained to assess the situation quickly rather than waiting to be told what to do."
        ),
        "resource_type": "tip",
        "sport": None,
        "tags": ["defense", "positioning", "fundamentals"],
        "is_featured": True,
        "read_time_minutes": 3,
    },
    {
        "title": "How to Run an Effective Practice in 60 Minutes",
        "body": (
            "Time is your scarcest resource as a youth coach. A well-structured 60-minute practice should follow a "
            "consistent arc: 10 minutes of dynamic warm-up, 15 minutes of individual skill work, 20 minutes of small-sided "
            "games or drills that put skills in context, and 15 minutes of full-team scrimmage with a clear coaching focus.\n\n"
            "The biggest mistake coaches make is spending too long on a single activity. Kids lose focus after 8–12 minutes. "
            "Build transitions into your plan and keep them under 90 seconds. Having equipment pre-staged before practice starts "
            "is the single highest-leverage habit you can develop.\n\n"
            "End every practice with a quick team huddle. Ask one player to share one thing they learned that day. "
            "This closes the loop cognitively, boosts retention, and gives shy players a voice in a low-pressure format."
        ),
        "resource_type": "tip",
        "sport": None,
        "tags": ["practice-planning", "time-management", "organization"],
        "is_featured": True,
        "read_time_minutes": 3,
    },
    {
        "title": "Communication Drills for Team Cohesion",
        "body": (
            "Teams that talk win more games. Communication on the field is a skill just like dribbling or shooting, "
            "and it must be practiced explicitly. Start with 'calling your shot' drills: before every pass or movement, "
            "the player must verbally announce it. This feels awkward at first but becomes second nature quickly.\n\n"
            "Another effective drill is the 'silent scrimmage': ban all verbal communication for five minutes, then switch "
            "to mandatory communication. The contrast is dramatic and teaches athletes how much information they're missing "
            "when teammates don't talk.\n\n"
            "Off the field, team cohesion is built through shared rituals — a pre-game chant, a team name for the defensive "
            "unit, or simply making eye contact and using first names when giving encouragement. These small habits signal "
            "psychological safety, which is the foundation of elite team performance."
        ),
        "resource_type": "tip",
        "sport": None,
        "tags": ["communication", "teamwork", "culture"],
        "is_featured": False,
        "read_time_minutes": 3,
    },
    {
        "title": "Five Ways to Keep Substitutes Engaged on the Bench",
        "body": (
            "Bench players who mentally check out during games fall behind in development. The best coaches assign "
            "specific observational jobs to substitutes: 'Watch the opposing center back — tell me what foot they favor.' "
            "This keeps athletes mentally in the game and often surfaces insights the coach misses while managing other players.\n\n"
            "Another strategy is the 'mirror drill': a substitute stands on the sideline and mimics the movements of their "
            "positional counterpart on the field. This keeps bodies warm and minds engaged simultaneously.\n\n"
            "Before putting a sub into the game, brief them on one specific task rather than a list of instructions. "
            "Overloading a player just before they enter creates anxiety and poor decision-making. One clear job done well "
            "beats five things done poorly."
        ),
        "resource_type": "tip",
        "sport": None,
        "tags": ["substitutions", "player-development", "game-management"],
        "is_featured": False,
        "read_time_minutes": 3,
    },
    {
        "title": "Teaching Spatial Awareness to Young Athletes",
        "body": (
            "Spatial awareness — knowing where you are relative to teammates, opponents, and boundaries — is one of the "
            "most coachable skills that coaches rarely coach explicitly. The simplest tool is the 'head up' habit: "
            "every time a player receives the ball, they must look up before their first touch. Penalize any eyes-down "
            "play in training until it becomes automatic.\n\n"
            "Shadow drills, where athletes mirror a leader's movements without a ball, develop peripheral awareness and "
            "body-to-body spatial calibration. These are especially effective for younger athletes (U10–U14) whose "
            "proprioceptive systems are still developing.\n\n"
            "Use cones to create 'awareness zones' on the practice field. Any player inside the zone must call out the "
            "number of opponents within ten yards before playing the ball. It sounds demanding, but athletes adapt quickly "
            "and the game-day payoff is significant."
        ),
        "resource_type": "tip",
        "sport": None,
        "tags": ["spatial-awareness", "fundamentals", "youth-development"],
        "is_featured": False,
        "read_time_minutes": 4,
    },
    {
        "title": "Ice Time Distribution: A Fair Approach for Youth Hockey",
        "body": (
            "Fair ice time is one of the most contentious topics in youth hockey. The key is distinguishing between "
            "'equal' and 'equitable' — two concepts that are often conflated. Equal means every player skates the same "
            "minutes. Equitable means every player gets the ice time appropriate to their development needs and team role.\n\n"
            "For U12 and younger, equal ice time is generally the right approach because development is the primary goal. "
            "For U15 and older, differentiation based on effort and preparation is developmentally appropriate, but "
            "communication with families is essential to avoid perception of favoritism.\n\n"
            "Track ice time with a spreadsheet and share it with parents monthly. Transparency eliminates 90% of "
            "complaints before they start. When parents can see the numbers, the conversation shifts from suspicion "
            "to the athlete's development needs."
        ),
        "resource_type": "tip",
        "sport": "hockey",
        "tags": ["ice-time", "fairness", "youth-hockey"],
        "is_featured": False,
        "read_time_minutes": 3,
    },
    {
        "title": "Pitching Mechanics: The Three Checkpoints Every Coach Should Know",
        "body": (
            "You don't need to be a former pitcher to teach safe, effective pitching mechanics. Focus on three checkpoints "
            "that catch 80% of the common errors. Checkpoint one: arm angle at foot strike — the throwing arm should be "
            "in an 'L' shape, elbow at shoulder height. Dropping the elbow here is the primary cause of arm stress in young pitchers.\n\n"
            "Checkpoint two: hip-to-shoulder separation. Young pitchers often rotate their entire body as one unit. "
            "Teach them to 'open the hips before the shoulders' to generate velocity and reduce arm load.\n\n"
            "Checkpoint three: follow-through. The arm should finish across the body, past the opposite hip. "
            "An abrupt stop or a high finish indicates the athlete is braking with the shoulder instead of decelerating "
            "naturally — a recipe for injury over time."
        ),
        "resource_type": "tip",
        "sport": "baseball",
        "tags": ["pitching", "mechanics", "injury-prevention"],
        "is_featured": False,
        "read_time_minutes": 4,
    },
    {
        "title": "Basketball Timeout Huddle: A 30-Second Framework",
        "body": (
            "Most coaches waste the first 10 seconds of a timeout catching their breath. The best coaches have a "
            "scripted framework that maximizes every second. Here's one that works: seconds 0–5, give the emotional "
            "reset ('take a breath, we're good'). Seconds 5–20, name one defensive adjustment and one offensive action. "
            "Seconds 20–28, confirm understanding ('what are we doing?'). Final two seconds, team chant.\n\n"
            "Limit yourself to two pieces of information maximum. Research on cognitive load shows that athletes in "
            "high-stress situations can only reliably absorb two new instructions at a time. More than that and "
            "nothing lands.\n\n"
            "Practice your timeout framework in training, not just in games. Run a mock game scenario and call timeouts "
            "so athletes are conditioned to focus immediately when they enter the huddle."
        ),
        "resource_type": "tip",
        "sport": "basketball",
        "tags": ["game-management", "timeouts", "in-game-coaching"],
        "is_featured": False,
        "read_time_minutes": 3,
    },

    # ── Articles ──────────────────────────────────────────────────────────────
    {
        "title": "Understanding LTAD: A Guide for Youth Coaches",
        "body": (
            "Long-Term Athlete Development (LTAD) is a framework developed by sport scientists to guide how coaches "
            "should approach training at different ages. The core insight is that children are not small adults — their "
            "physiological and psychological development follows predictable windows that, if understood, allow coaches "
            "to accelerate skill acquisition and reduce burnout and injury.\n\n"
            "The framework identifies key stages: FUNdamentals (ages 6–9), Learning to Train (9–12), Training to Train "
            "(12–16), Training to Compete (16–18), and Training to Win (18+). Each stage has distinct priorities. "
            "During FUNdamentals, the goal is developing basic movement literacy through play. Introducing sport-specific "
            "tactical training at this stage is counterproductive and often harmful to long-term development.\n\n"
            "The Training to Train stage (roughly U12–U16) is often called the 'golden age of learning.' Motor patterns "
            "are acquired faster and more durably during this window than at any other time. Coaches who understand this "
            "will prioritize high-repetition technical work during this phase rather than game-heavy schedules.\n\n"
            "One of the most important — and most violated — principles of LTAD is avoiding early specialization. "
            "Research consistently shows that multi-sport athletes outperform early specializers in the long run, "
            "experience fewer overuse injuries, and enjoy sport for longer. As a youth coach, one of the most valuable "
            "things you can do is encourage your athletes to play multiple sports."
        ),
        "resource_type": "article",
        "sport": None,
        "tags": ["LTAD", "player-development", "youth-sports", "research"],
        "is_featured": True,
        "read_time_minutes": 6,
    },
    {
        "title": "Building a Season Plan from Scratch",
        "body": (
            "A season plan is the difference between a coach who reacts and a coach who leads. It starts with the end: "
            "what do you want your athletes to have learned, experienced, and achieved by the final game? Writing this "
            "down forces clarity that shapes every practice and game decision you make.\n\n"
            "Divide your season into three phases: development (first third), integration (middle third), and competition "
            "(final third). During the development phase, prioritize individual skills and team systems over wins. "
            "During integration, put those skills into competitive contexts. During the competition phase, trust what "
            "you've built and focus on mental preparation and game management.\n\n"
            "Backward-plan your practices from the season calendar. If your first high-stakes game is in week 8, your "
            "tactical systems need to be established by week 6. That means you need to start introducing them in week 3 "
            "or 4 at the latest. This kind of timeline thinking prevents the common trap of coaches trying to install "
            "complex systems the week before playoffs.\n\n"
            "Build in one dedicated 'player feedback' session every 4–6 weeks. Ask athletes what's working, what's "
            "confusing, and what they want more of. This feedback loop improves practice quality and gives athletes "
            "ownership over their development — a powerful intrinsic motivator."
        ),
        "resource_type": "article",
        "sport": None,
        "tags": ["season-planning", "periodization", "coaching-strategy"],
        "is_featured": False,
        "read_time_minutes": 7,
    },
    {
        "title": "Managing Player Development vs. Winning: Finding the Balance",
        "body": (
            "Every youth coach eventually faces the tension between developing players and winning games. A coach who "
            "prioritizes wins will play their best eight players and bench the others. A coach who prioritizes development "
            "will play all twelve, accept more losses, and focus on skill acquisition. Neither extreme is right, and "
            "the balance depends heavily on age and competitive level.\n\n"
            "At U10 and younger, the research is unambiguous: development should be the near-exclusive focus. Winning "
            "at this age predicts almost nothing about long-term success and often comes at the cost of the very habits "
            "— risk-taking, creativity, trying new positions — that produce elite athletes later.\n\n"
            "At the U15–U18 level, the calculus changes. Athletes at this stage benefit from competitive pressure, and "
            "learning to perform under stakes is itself a developmental skill. But even here, the most successful "
            "programs keep one principle central: put athletes in positions to succeed, and expand those positions "
            "gradually as competence grows.\n\n"
            "The practical tool that helps most coaches navigate this is the 'development minute': every player earns "
            "some baseline of playing time regardless of performance. Beyond that baseline, time is performance-based. "
            "This creates accountability without abandoning development principles for any individual."
        ),
        "resource_type": "article",
        "sport": None,
        "tags": ["player-development", "winning", "coaching-philosophy"],
        "is_featured": False,
        "read_time_minutes": 6,
    },
    {
        "title": "The Science of Rest: Why Recovery Is Your Secret Weapon",
        "body": (
            "Most youth coaches think their job is to make athletes work harder. The best coaches understand that "
            "adaptation — the physiological process that makes athletes better — happens during recovery, not during "
            "training. Training is just the stimulus. Rest is where the gains occur.\n\n"
            "For youth athletes, sleep is the most powerful recovery tool available. Teenagers need 8–10 hours per night, "
            "yet most get 6–7. The effects are dramatic: sleep-deprived athletes have slower reaction times, reduced "
            "strength output, impaired decision-making, and significantly elevated injury risk. Coaches who educate "
            "families about sleep hygiene are doing more for athlete performance than any drill ever could.\n\n"
            "Nutrition timing matters more for recovery than most youth coaches realize. Athletes should consume protein "
            "and carbohydrates within 30 minutes of training. This 'recovery window' is when muscles are most receptive "
            "to nutrients. A practical hack: keep a cooler at practice with chocolate milk, which provides an ideal "
            "protein-to-carbohydrate ratio at low cost.\n\n"
            "Active recovery — light movement on rest days — outperforms complete rest for most athletes. A 20-minute "
            "walk, swim, or yoga session on off days keeps blood flowing, reduces muscle soreness, and maintains the "
            "mental routine of staying active."
        ),
        "resource_type": "article",
        "sport": None,
        "tags": ["recovery", "sports-science", "sleep", "nutrition"],
        "is_featured": False,
        "read_time_minutes": 5,
    },
    {
        "title": "Parent Communication: Building Allies Instead of Adversaries",
        "body": (
            "Parent relationships are often the most challenging part of coaching youth sports. The coaches who navigate "
            "them best treat parents as partners in athlete development rather than obstacles to manage.\n\n"
            "Start the season with a team meeting that includes parents. Share your coaching philosophy, your "
            "expectations for player behavior, and your communication preferences (email vs. in-person, timing of "
            "conversations). Research shows that explicit up-front communication reduces conflict dramatically throughout "
            "the season because expectations are shared.\n\n"
            "Adopt the '24-hour rule' for game-related concerns: ask parents not to approach you about playing time or "
            "game decisions within 24 hours of a game. Emotions are elevated in this window and conversations rarely "
            "go well. A day later, both parties are more rational.\n\n"
            "Celebrate parents who model good sideline behavior publicly. A quick 'I loved how you cheered for everyone "
            "today' goes a long way. Social norms on the sideline are shaped by what gets attention — make sure positive "
            "behavior gets the most."
        ),
        "resource_type": "article",
        "sport": None,
        "tags": ["parent-communication", "team-culture", "coaching-skills"],
        "is_featured": False,
        "read_time_minutes": 5,
    },

    # ── Motivation ────────────────────────────────────────────────────────────
    {
        "title": "Why Every Kid Deserves Ice Time",
        "body": (
            "There is a player on every team who rarely starts, who may never score a goal, who probably won't play "
            "in college. That player is watching you right now. They're watching to see if you believe they matter.\n\n"
            "What you do with that player will stay with them longer than any trophy. The coach who pulled them aside, "
            "taught them something specific, and put them in the game when it counted — that coach becomes part of "
            "their story. The one who benched them, forgot their name, or only cared about winning becomes part of "
            "their story too, just a different chapter.\n\n"
            "Ice time — or court time, or field time — is the currency of youth sports. How you distribute it says "
            "everything about what you value. Elite programs know that developing every player, not just the stars, "
            "creates deeper talent pools, better practice environments, and teams that win not just games but people.\n\n"
            "Give every kid the ice time they've earned, and then give them a little more. You won't regret it."
        ),
        "resource_type": "motivation",
        "sport": "hockey",
        "tags": ["inclusion", "playing-time", "coaching-philosophy", "inspiration"],
        "is_featured": True,
        "read_time_minutes": 3,
    },
    {
        "title": "The Coach's Mindset: Growth Over Results",
        "body": (
            "The scoreboard is a lagging indicator. It tells you what happened, not why, and rarely tells you what "
            "to do next. The coaches who build the best programs over time are the ones who learned to read the "
            "leading indicators: effort levels, decision quality, communication habits, willingness to try hard things.\n\n"
            "A growth mindset in coaching means celebrating the failed attempt at a difficult skill as loudly as the "
            "successful one. It means designing practices where mistakes are inevitable, because no growth happens "
            "at the edge of comfort. It means asking 'what did we learn?' after a loss with the same curiosity "
            "you'd bring to a win.\n\n"
            "Your athletes are watching how you respond to setbacks. When the team is losing and you stay calm, "
            "curious, and solution-focused, you're teaching them something more valuable than any tactical adjustment. "
            "You're showing them that adversity is information, not verdict.\n\n"
            "The results will come. Focus on the inputs you control — preparation, attitude, effort, and learning — "
            "and the scoreboard tends to take care of itself."
        ),
        "resource_type": "motivation",
        "sport": None,
        "tags": ["mindset", "growth", "coaching-philosophy", "resilience"],
        "is_featured": True,
        "read_time_minutes": 4,
    },
    {
        "title": "When Your Team is Struggling: A Letter to Coaches",
        "body": (
            "If you're reading this after a tough stretch, you're not alone. Every coach — at every level — has "
            "sat with the weight of a losing skid, player conflicts, or a season that hasn't gone the way they planned. "
            "The fact that you're still here, still looking for answers, says everything about your character.\n\n"
            "The temptation when things go wrong is to double down on what you know — more drills, stricter discipline, "
            "more film. Sometimes that's right. But often what struggling teams need most is space: a lighter practice, "
            "a conversation instead of a chalk talk, a reminder of why everyone is here.\n\n"
            "Go back to the beginning. Why did you start coaching? Why did your athletes start playing? Those answers "
            "are the foundation. When the tactical stuff stops working, the foundation is what's left, and it's enough "
            "to build from.\n\n"
            "Your athletes need to see you believe it's going to be okay. Not because you're pretending — because you "
            "genuinely understand that hard stretches are part of the process. Be honest with them, be steady, and "
            "keep showing up. That's the whole job."
        ),
        "resource_type": "motivation",
        "sport": None,
        "tags": ["resilience", "adversity", "coaching-mindset", "inspiration"],
        "is_featured": False,
        "read_time_minutes": 4,
    },
    {
        "title": "The Athlete Who Almost Quit",
        "body": (
            "Most athletes will want to quit at least once. The reasons vary — a rough patch, social dynamics, "
            "a bad game, a feeling that they're not good enough. What happens in that moment often determines "
            "whether they stay in sport for life or walk away.\n\n"
            "As a coach, you may never know when that moment is happening. The athlete who seems disengaged might "
            "be right on the edge. The one who misses a few practices might be looking for permission to leave. "
            "Your next interaction with them could be the one that matters most.\n\n"
            "The research on why athletes stay in sport points consistently to one factor above all others: "
            "a trusted adult who believed in them. Not their skill level. Not the team's record. A person who "
            "saw something in them worth staying for.\n\n"
            "Be that person. It doesn't require a speech or a grand gesture. It requires showing up consistently, "
            "learning their name, noticing their effort, and making them feel like they belong. That's a legacy "
            "that outlasts any championship."
        ),
        "resource_type": "motivation",
        "sport": None,
        "tags": ["athlete-retention", "mentorship", "inspiration", "youth-development"],
        "is_featured": False,
        "read_time_minutes": 3,
    },
    {
        "title": "Small Wins: The Science of Momentum in Team Sports",
        "body": (
            "Momentum is real, and it's buildable. Neuroscience research on reward and motivation shows that small "
            "successes trigger dopamine release that enhances focus, risk-taking, and persistence — exactly the "
            "qualities coaches want from their teams.\n\n"
            "The practical implication: design your season to create early wins, even if they're manufactured. "
            "Match your team against opponents where success is likely in your first few games. Structure practices "
            "so athletes finish feeling competent, not defeated. Celebrate small improvements explicitly and "
            "specifically — 'your help defense rotation was perfect that last possession' is more powerful than "
            "generic praise.\n\n"
            "In games, look for momentum shifts and manage them actively. Call a timeout when the other team goes on "
            "a run — not just for strategy, but to interrupt their momentum and reset your team's mental state. "
            "Change a line, rotate a player, or simply huddle and remind your athletes of something they did well "
            "earlier in the game.\n\n"
            "Teams that believe they can come back from deficits usually do more often than those who don't. "
            "Belief is a coaching output, not an accident."
        ),
        "resource_type": "motivation",
        "sport": None,
        "tags": ["momentum", "psychology", "team-culture", "sports-science"],
        "is_featured": False,
        "read_time_minutes": 4,
    },

    # ── Best Practices ────────────────────────────────────────────────────────
    {
        "title": "Pre-Practice Warm-Up Protocols That Actually Work",
        "body": (
            "The static stretching routine that coaches have used for decades — hold a stretch for 30 seconds, "
            "repeat — is largely ineffective as warm-up and may actually impair performance when done before activity. "
            "Modern sports science is clear: dynamic warm-up beats static stretching for injury prevention and "
            "performance readiness.\n\n"
            "A reliable 8-minute dynamic warm-up protocol: two minutes of light jogging with gradual acceleration, "
            "followed by leg swings (forward/back and side-to-side, 10 reps each), hip circles, walking lunges with "
            "a reach, lateral shuffles, backpedaling, and high knees. Finish with 2–3 short accelerations at "
            "80% effort.\n\n"
            "Teach athletes to lead the warm-up. Rotating the warm-up leader has multiple benefits: it develops "
            "leadership skills, ensures athletes know the protocol well enough to teach it, and gives them ownership "
            "over their physical preparation.\n\n"
            "Save static stretching for the cool-down, when muscles are fully warm and pliable. Post-activity is "
            "when flexibility work has the greatest effect and carries the least injury risk."
        ),
        "resource_type": "best_practice",
        "sport": None,
        "tags": ["warm-up", "injury-prevention", "sports-science", "protocol"],
        "is_featured": False,
        "read_time_minutes": 4,
    },
    {
        "title": "How to Give Effective Feedback to Young Athletes",
        "body": (
            "Feedback is the most powerful coaching tool available, and the most commonly misused. The research on "
            "feedback effectiveness in motor learning is remarkably consistent: immediate, specific, and descriptive "
            "feedback accelerates skill acquisition more than any other variable.\n\n"
            "The sandwich method — positive, corrective, positive — is a reasonable starting point, but take it "
            "further. Make your corrective feedback a question when possible: 'What did your plant foot do on that "
            "shot?' forces the athlete to analyze rather than just receive information. This self-discovery process "
            "creates stronger neural pathways than being told the answer.\n\n"
            "Timing matters enormously. Feedback delivered during an activity (concurrent feedback) is less effective "
            "than feedback delivered immediately after (terminal feedback) for complex skills. Let the movement finish, "
            "then debrief.\n\n"
            "Be sparing with praise that isn't earned. Hollow encouragement ('great job!') loses its value quickly. "
            "Specific, earned praise ('your communication on that defensive rotation was exactly what we worked on') "
            "maintains its power because athletes trust that you mean it."
        ),
        "resource_type": "best_practice",
        "sport": None,
        "tags": ["feedback", "coaching-skills", "motor-learning", "communication"],
        "is_featured": False,
        "read_time_minutes": 5,
    },
    {
        "title": "Concussion Protocol: What Every Youth Coach Must Know",
        "body": (
            "Concussion management has changed dramatically in the past decade, and coaches who aren't current on "
            "best practices are putting athletes at risk. The foundational rule is simple and non-negotiable: "
            "when in doubt, sit them out. Any athlete who shows signs of concussion must be removed from play "
            "immediately and cannot return to activity until cleared by a licensed healthcare provider.\n\n"
            "Common signs that are often missed: emotional sensitivity or irritability, sensitivity to light or noise, "
            "feeling 'foggy' or slowed down, and subtle balance changes. Athletes rarely report these symptoms "
            "voluntarily, especially in competitive situations. Teach teammates to speak up when they notice changes "
            "in a fellow athlete — peer reporting is more reliable than self-reporting.\n\n"
            "Return to play follows a graduated protocol: rest, light aerobic activity, sport-specific exercise, "
            "non-contact practice, full-contact practice, and return to competition. Each step requires 24 hours "
            "without symptoms before advancing. Rushing this protocol significantly increases re-injury risk.\n\n"
            "Post the concussion protocol in your team handbook and review it with parents at the start of the season. "
            "Coaches who normalize the conversation create safer environments than those who treat it as an edge case."
        ),
        "resource_type": "best_practice",
        "sport": None,
        "tags": ["concussion", "safety", "medical-protocol", "injury-management"],
        "is_featured": False,
        "read_time_minutes": 5,
    },
    {
        "title": "Designing Small-Sided Games That Maximize Skill Transfer",
        "body": (
            "Small-sided games (SSGs) are the most effective training format in most team sports, yet many coaches "
            "use them incorrectly. The key is designing constraints that force the specific skill or decision you want "
            "to develop, rather than running generic pick-up games and hoping skills emerge.\n\n"
            "Constraint-led design works like this: identify the skill you want to develop, then ask what game format "
            "would make NOT using that skill disadvantageous. Want to develop switching the point of attack? Play on "
            "a wide field. Want to develop first-touch control? Require two touches before shooting. Want to develop "
            "defensive pressure? Award bonus points for winning the ball in the attacking third.\n\n"
            "Optimal group sizes for SSGs depend on sport and objective. Generally, 2v2 to 4v4 maximizes individual "
            "ball touches and decision reps. 5v5 to 7v7 introduces more realistic tactical complexity. Full-sided games "
            "are best reserved for the end of practice when habits from SSGs are fresh.\n\n"
            "Coach less during SSGs. Your role is to design the game well, observe carefully, and intervene only when "
            "the target skill isn't emerging. Over-coaching during SSGs kills the discovery learning that makes them "
            "so effective."
        ),
        "resource_type": "best_practice",
        "sport": None,
        "tags": ["small-sided-games", "practice-design", "skill-transfer", "constraints"],
        "is_featured": False,
        "read_time_minutes": 5,
    },
    {
        "title": "End-of-Season Athlete Review: A Template for Meaningful Conversations",
        "body": (
            "End-of-season conversations with athletes are one of the highest-leverage activities coaches rarely do "
            "well. A 10-minute one-on-one that's thoughtfully structured leaves athletes with clarity about their "
            "development, motivation to improve in the off-season, and a stronger relationship with their coach.\n\n"
            "Structure the conversation in four parts. First, ask the athlete to self-assess: 'What's the thing you're "
            "most proud of this season?' This surfaces information you may not have and signals that their perspective "
            "matters. Second, share one genuine strength observation from your own view. Third, offer one specific "
            "development focus for the off-season — not a critique, but a growth edge. Fourth, close with a forward "
            "look: 'What's one thing you're excited about for next season?'\n\n"
            "Take notes before the conversation. Athletes can tell whether you've thought about them specifically or "
            "are giving a generic assessment. Specificity is respect.\n\n"
            "For younger athletes, keep it light and positive. The goal is motivation and connection, not evaluation. "
            "Reserve detailed technical feedback for athletes who are old enough to act on it meaningfully."
        ),
        "resource_type": "best_practice",
        "sport": None,
        "tags": ["athlete-review", "feedback", "end-of-season", "player-development"],
        "is_featured": False,
        "read_time_minutes": 4,
    },
    {
        "title": "Hydration Guidelines for Youth Athletes: What Coaches Need to Know",
        "body": (
            "Dehydration is one of the most common and most preventable causes of performance decline and injury in "
            "youth sports. Even mild dehydration — as little as 2% body weight loss — measurably impairs reaction "
            "time, endurance, and decision-making. The challenge is that thirst is not a reliable indicator of "
            "hydration status in children; by the time they're thirsty, they're already behind.\n\n"
            "Establish mandatory water breaks every 15–20 minutes during practice, regardless of athlete preference. "
            "Some athletes resist because they don't feel thirsty — educate them on why this matters. In hot weather, "
            "increase frequency and consider electrolyte supplementation for sessions over 60 minutes.\n\n"
            "Pre-hydration matters as much as during-activity hydration. Encourage athletes to drink 16–20 oz of water "
            "2 hours before practice, and another 8 oz 15 minutes before activity. Post-practice, they should drink "
            "to restore any weight lost during activity.\n\n"
            "Sports drinks are appropriate for activities over 60 minutes at high intensity. For shorter sessions, "
            "water is sufficient. The sugar and sodium in sports drinks provide no benefit for a 45-minute youth "
            "practice and add unnecessary calories."
        ),
        "resource_type": "best_practice",
        "sport": None,
        "tags": ["hydration", "nutrition", "health", "youth-athletes"],
        "is_featured": False,
        "read_time_minutes": 4,
    },
    {
        "title": "Video Review Best Practices for Youth Teams",
        "body": (
            "Video review can be a powerful development tool at the youth level, but it must be used thoughtfully. "
            "The primary risk is using video to criticize in front of peers, which damages trust and psychological "
            "safety. The primary opportunity is making the invisible visible — showing athletes patterns in their "
            "own movement that they can't perceive in the moment.\n\n"
            "Keep video sessions short: 10–15 minutes maximum. Attention drops off quickly in group settings. "
            "Start with a clear question ('what do you notice about our spacing in transition?') rather than "
            "lecturing. Let athletes identify the issues before you name them.\n\n"
            "When showing individual errors, always obtain the athlete's consent first and review with them privately "
            "before the group session. The goal is learning, not exposure. A player who feels humiliated in front "
            "of teammates will resist feedback for the rest of the season.\n\n"
            "Clip the footage to 2–3 examples maximum per theme. More than that and the message gets diluted. "
            "Pair every critical clip with a positive one showing the same situation handled correctly — by the same "
            "athlete if possible, by anyone on the team if not."
        ),
        "resource_type": "best_practice",
        "sport": None,
        "tags": ["video-analysis", "coaching-tools", "feedback", "team-development"],
        "is_featured": False,
        "read_time_minutes": 4,
    },
]


async def seed_resources(db: AsyncSession) -> int:
    """Seed the resources table if empty. Returns the number of records inserted."""
    count_result = await db.execute(select(Resource))
    existing = count_result.scalars().first()
    if existing is not None:
        return 0

    now = datetime.utcnow()
    inserted = 0
    for item in SEED_DATA:
        resource = Resource(
            title=item["title"],
            body=item["body"],
            resource_type=item["resource_type"],
            sport=item["sport"],
            tags=item["tags"],
            is_featured=item["is_featured"],
            read_time_minutes=item["read_time_minutes"],
            created_at=now,
        )
        db.add(resource)
        inserted += 1

    await db.commit()
    return inserted
