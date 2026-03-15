// Extraction Test Suite — 35 Diverse Scenarios
// Tests the extraction prompt against varied real-world conversations
// Run with: node test/extraction/run-extraction-tests.js

const SCENARIOS = [

  // ============================================================
  // CATEGORY 1: PWD WORK STORIES (7 scenarios)
  // ============================================================

  {
    id: 'PWD-01',
    category: 'PWD Work',
    description: 'Deaf person working as virtual assistant — adapted communication methods',
    expected_skills: ['SK2:intermediate', 'SK5:intermediate', 'SK4:basic', 'SK6:basic'],
    expected_min_skills: 3,
    should_not_flag_gaming: true,
    transcript: `AI: How are you doing today?
User: im okay. im deaf so i communicate mostly thru text and chat
AI: Thanks for sharing that. What kind of work do you do?
User: im a virtual assistant for 4 years now. i handle emails, schedules, social media for my clients
AI: That sounds like interesting work. Can you tell me about a time when you had to figure something out at work?
User: yes one time my client wanted me to join a zoom call with their team. i was worried because i cant hear. but i figured out i can use the auto caption feature and type my responses in the chat. my client was surprised it worked so well
AI: That's really resourceful! How did you come up with that solution?
User: i searched online and tried different tools. otter ai was good but zoom captions were enough. i also prepared written notes before the meeting so i could follow along better
AI: What happened after that meeting?
User: my client started including me in more meetings. they even told their other clients about how i handle it. now i help 3 clients with meeting support
AI: How did that make you feel?
User: proud. i showed them deaf people can do this work. some people dont think we can but we find ways
AI: Looking back, what did you learn from that experience?
User: that there is always a workaround if you look hard enough. and that showing people works better than telling them`
  },

  {
    id: 'PWD-02',
    category: 'PWD Work',
    description: 'Wheelchair user managing a sari-sari store — physical adaptations and customer service',
    expected_skills: ['SK4:intermediate', 'SK2:intermediate', 'SK5:intermediate', 'SK1:basic'],
    expected_min_skills: 3,
    should_not_flag_gaming: true,
    transcript: `AI: What's been keeping you busy lately?
User: i run our family sari sari store. im in a wheelchair so we had to arrange everything so i can reach it
AI: How did you set that up?
User: i redesigned the store layout. put the popular items on the lower shelves where i can reach. put a ramp at the entrance. installed a bell so customers can call me if they need something from the top shelf and my brother helps
AI: That's clever! Have you had any challenges with customers?
User: yes some customers are impatient. one time a customer was angry because i was slow getting something from the back. she said maybe i shouldnt be running a store
AI: That must have been really hurtful. What did you do?
User: i was upset inside but i just smiled and said sorry for the wait ate, let me get that for you. i served her nicely. she came back next day and actually apologized. now shes a regular
AI: How did you handle those feelings in the moment?
User: i just breathe and remind myself that this is MY store. i know im good at this. some people just dont understand
AI: What have you learned from running the store?
User: that being in a wheelchair doesnt mean you cant work. you just have to be creative. and treating people well even when theyre rude usually works out`
  },

  {
    id: 'PWD-03',
    category: 'PWD Work',
    description: 'Person with cerebral palsy doing data entry — speed challenges and team support',
    expected_skills: ['SK5:intermediate', 'SK3:basic', 'SK6:intermediate', 'SK1:basic'],
    expected_min_skills: 3,
    should_not_flag_gaming: true,
    transcript: `AI: Tell me about your work experience.
User: i do data entry for a bpo company. i have mild cerebral palsy so my typing is slower than others
AI: How has that affected your work?
User: at first my supervisor was worried about my speed. but i asked if i could use voice to text software and keyboard shortcuts. it helped a lot
AI: How did you learn to use those tools?
User: youtube tutorials mostly. then i practiced every night for 2 weeks. my accuracy actually became better than most of my teammates because i double check everything
AI: That's impressive. How did your team react?
User: they were supportive. my seatmate helped me learn the shortcuts faster. and my supervisor started using me for the quality check tasks because my accuracy was highest
AI: Was there ever a time when it was really difficult?
User: the first month was hard. i wanted to quit. i cried at home. but my mom said just try one more week. so i kept going. now its been 2 years`
  },

  {
    id: 'PWD-04',
    category: 'PWD Work',
    description: 'Visually impaired person teaching online — created accessible curriculum',
    expected_skills: ['SK2:advanced', 'SK4:intermediate', 'SK6:intermediate', 'SK8:intermediate'],
    expected_min_skills: 4,
    should_not_flag_gaming: true,
    transcript: `AI: What do you do for work?
User: i teach english online to korean students. im visually impaired, i can see shapes but not details
AI: How do you manage teaching with visual impairment?
User: i designed all my lessons to be audio-first. i use screen reader for my materials. i create listening exercises instead of reading ones. my students actually learn better because they focus on speaking
AI: Can you tell me about a specific teaching challenge you solved?
User: one student was very shy and never spoke. i couldnt see his facial expressions to know if he was confused. so i created a system where he types a number 1-5 for how confident he feels. 1 means lost, 5 means great. this way i could adjust without seeing him
AI: That's really innovative. What happened with that student?
User: after 3 months he was speaking full sentences. his mom sent me a message saying he talks about our lessons all the time. he went from failing english at school to getting 85. i adapted that rating system for all my students now
AI: What does teaching mean to you?
User: it proves that disability doesnt limit what you can contribute. my students dont even know im visually impaired for the first few weeks. when they find out they are shocked. it changes how they think about disability`
  },

  {
    id: 'PWD-05',
    category: 'PWD Work',
    description: 'Person with psychosocial disability (anxiety) navigating workplace disclosure',
    expected_skills: ['SK1:intermediate', 'SK2:intermediate', 'SK5:intermediate'],
    expected_min_skills: 3,
    should_not_flag_gaming: true,
    transcript: `AI: How are things going for you?
User: okay naman. i have anxiety disorder so some days are hard but im managing
AI: How do you manage it at work?
User: i learned my triggers. crowded meetings make me panic. so i asked my boss if i can join meetings via video even when others are in the room. she said yes
AI: Was it hard to ask for that?
User: very hard. i was scared she would think im weak or not capable. i practiced what to say with my therapist first. then i just told her honestly that i work better with some accommodations
AI: How did she respond?
User: she was actually really understanding. she said she wished more people would speak up about what they need. she even asked if there was anything else that would help
AI: Has there been a time when your anxiety affected your work performance?
User: yes once i had a panic attack before a big presentation. i couldnt breathe. but i used my breathing technique, told my teammate i needed 5 minutes, then did the presentation. it wasnt perfect but i got through it. my teammate covered the first slide while i composed myself
AI: What have you learned about managing anxiety at work?
User: that asking for help is not weakness. and that most people are kinder than you expect. also that knowing your patterns helps you prepare`
  },

  {
    id: 'PWD-06',
    category: 'PWD Work',
    description: 'Person with progressive disability (osteoarthritis) adapting career',
    expected_skills: ['SK5:advanced', 'SK4:intermediate', 'SK1:intermediate', 'SK7:basic'],
    expected_min_skills: 3,
    should_not_flag_gaming: true,
    transcript: `AI: What kind of work have you been doing?
User: i was admin staff for 12 years but my osteoarthritis is getting worse. cant sit at a desk for long hours anymore. so im transitioning to freelance work from home
AI: How are you managing that transition?
User: its scary. i had a stable salary and benefits. but i realized i need to plan before my condition gets worse. so i started learning digital skills at night while still employed. took virtualahan training. started getting small clients
AI: What was the hardest part of that decision?
User: leaving the security. my family depends on me. but i calculated that if i wait too long i wont be able to work at all. so better to build something flexible now while i still can
AI: How did you build up your freelance work?
User: i told everyone i know that im available. former colleagues started referring me. i also joined online freelancer groups for PWDs. within 6 months i had enough clients to match my old salary. now i work my own hours and rest when my joints hurt
AI: What has this experience taught you about yourself?
User: that i can reinvent myself even at my age with a progressive condition. i used to think my career was over. but actually i have more control now than i ever did. i just had to be brave enough to make the change before i was forced to`
  },

  {
    id: 'PWD-07',
    category: 'PWD Work',
    description: 'Stroke survivor returning to senior role — identity adjustment',
    expected_skills: ['SK1:advanced', 'SK5:advanced', 'SK2:intermediate', 'SK7:intermediate'],
    expected_min_skills: 4,
    should_not_flag_gaming: true,
    transcript: `AI: Can you tell me about your work background?
User: i was a senior territory manager for 32 years. MBA holder. then i had a hemorrhagic stroke. everything changed overnight
AI: What was the recovery like?
User: i lost speech for 3 months. couldn't write. couldn't walk properly. i went from managing 50 people to needing help eating. the hardest part wasn't physical. it was the identity loss. i didn't know who i was anymore without my title
AI: How did you work through that?
User: therapy helped. but honestly what helped most was accepting that i'm still the same person with the same brain, just in a different body now. i started writing again slowly. first words, then sentences. i documented my recovery as a way to prove to myself i could still think strategically
AI: Are you working now?
User: im consulting part time. i cant do the travel or long hours but my 32 years of experience and relationships are still there. my former clients still call me for advice. i had to learn to deliver value differently — through video calls and written strategies instead of in-person meetings
AI: What would you tell someone going through something similar?
User: that your value is not your job title. and that sometimes losing everything shows you what actually matters and what you're actually good at, stripped of all the corporate packaging`
  },

  // ============================================================
  // CATEGORY 2: PERSONAL / FAMILY STORIES (7 scenarios)
  // ============================================================

  {
    id: 'PER-01',
    category: 'Personal',
    description: 'Single mother navigating childcare while working — resourcefulness',
    expected_skills: ['SK4:intermediate', 'SK5:intermediate', 'SK3:basic', 'SK1:basic'],
    expected_min_skills: 3,
    should_not_flag_gaming: true,
    transcript: `AI: How are you doing today?
User: tired pero okay. being a single mom is no joke
AI: I can imagine! What's a typical day like for you?
User: wake up 5am. prepare breakfast and lunch for my daughter. bring her to school. work from 8 to 5 at a call center. pick her up. homework. cook. sleep. repeat
AI: Has there been a time when the schedule got really hard to manage?
User: last month my daughter got dengue. i had to be at the hospital but also couldnt miss work or i lose my job. so i arranged with my neighbor tita to watch her during the day, i worked half days, then rushed to the hospital after
AI: How did you manage that with your employer?
User: i was honest with my team lead. i said i can work but need to leave at 2pm for a week. she let me take calls from the hospital on my phone during the less busy hours. i still hit my targets that week
AI: That's amazing. How did it all work out?
User: my daughter recovered. my tita didn't charge me. and my team lead said she respected how i handled it. she recommended me for a promotion after that`
  },

  {
    id: 'PER-02',
    category: 'Personal',
    description: 'Youth caring for elderly grandparent — patience and caregiving',
    expected_skills: ['SK1:intermediate', 'SK5:basic', 'SK2:basic'],
    expected_min_skills: 2,
    should_not_flag_gaming: true,
    transcript: `AI: What's been going on in your life lately?
User: i take care of my lola. she has dementia. its hard because she forgets who i am sometimes
AI: That must be really emotional. How do you handle those moments?
User: i just remind her gently. lola its me, your apo. sometimes she gets agitated so i play her favorite songs from the 60s. it calms her down. music is the last thing dementia takes away
AI: How did you learn to care for someone with dementia?
User: mostly youtube and talking to her doctor. theres no manual for it. you just learn day by day what works and what doesnt
AI: Has there been a particularly difficult moment?
User: she wandered out at 3am once. i panicked. searched the whole barangay. found her at the church sitting quietly. after that i installed a bell on the door and sleep lighter
AI: What has this experience taught you?
User: patience. so much patience. and that love looks different at different stages of life. i cant have a normal conversation with her anymore but i can hold her hand and be there`
  },

  {
    id: 'PER-03',
    category: 'Personal',
    description: 'Community organizer during typhoon — leadership and coordination',
    expected_skills: ['SK3:advanced', 'SK4:advanced', 'SK2:intermediate', 'SK1:intermediate', 'SK5:intermediate'],
    expected_min_skills: 4,
    should_not_flag_gaming: true,
    transcript: `AI: Tell me about something important you've been involved in.
User: during typhoon odette our barangay was badly hit. no electricity for 3 weeks. no water. i organized the relief effort even though im not a barangay official
AI: What did you do specifically?
User: first i went house to house to check who needed help most. made a list of elderly, sick, pregnant women. then i contacted NGOs and coordinated where the relief goods should go. i set up a system where each street had a representative who distributed to their neighbors
AI: How did people respond to you taking charge?
User: some barangay officials were annoyed. they said i was overstepping. but the people trusted me because i was actually on the ground helping, not waiting in the hall. eventually even the captain started coordinating with me
AI: What was the hardest part?
User: making decisions about who gets what when there isnt enough. one night we had 50 meals for 200 families. i had to prioritize. i gave to the families with babies and elderly first. some people were angry but i explained why and most understood
AI: What did this experience teach you?
User: that leadership is not about title. its about showing up when things are hard. and that organizing people is a skill — you have to communicate clearly, be fair, and stay calm when everyone is panicking`
  },

  {
    id: 'PER-04',
    category: 'Personal',
    description: 'Navigating inter-faith marriage — cultural negotiation (similar to Kuber caste story)',
    expected_skills: ['SK1:intermediate', 'SK2:intermediate', 'SK5:intermediate', 'SK8:basic'],
    expected_min_skills: 3,
    should_not_flag_gaming: true,
    transcript: `AI: What's something you've been dealing with recently?
User: me and my boyfriend want to get married but hes christian and im muslim. both families are against it
AI: That sounds really challenging. How are you handling it?
User: we talked a lot about what matters to us. decided that our love and respect for each other is more important than which religion we follow. but convincing families is harder
AI: What have you tried?
User: we asked both families to meet. at first they refused. then my boyfriend's mom agreed to have coffee with my mom. just the two moms. no dads. they talked and found out they have a lot in common — both worried about grandchildren, both want us to be happy
AI: Did that help?
User: my mom started softening. his mom too. the dads are still difficult. but we keep trying small steps. we dont push too hard. just keep showing them we are serious and respectful
AI: What keeps you going through this?
User: we made a promise to each other that we will always try the kind way first before the drastic way. and knowing that other couples have gone through this and made it work gives us hope`
  },

  {
    id: 'PER-05',
    category: 'Personal',
    description: 'Minimal/short answer style — low literacy or discomfort',
    expected_skills: ['SK4:basic', 'SK5:basic'],
    expected_min_skills: 1,
    should_not_flag_gaming: true,
    transcript: `AI: How are you today?
User: ok
AI: What have you been up to?
User: work
AI: What kind of work?
User: washing clothes for neighbors
AI: Has there been a hard time recently?
User: yes my washing machine broke
AI: Oh no! What did you do?
User: i hand washed everything for 2 weeks. 5 clients. was very tiring but i couldnt lose them
AI: How did you fix the machine?
User: saved money and bought second hand. my friend helped me find one
AI: That must have been exhausting. How did you keep going?
User: had to. no choice. my kids need to eat`
  },

  {
    id: 'PER-06',
    category: 'Personal',
    description: 'Taglish conversation — code-switching throughout',
    expected_skills: ['SK2:intermediate', 'SK4:intermediate', 'SK3:basic', 'SK1:basic'],
    expected_min_skills: 3,
    should_not_flag_gaming: true,
    transcript: `AI: Kumusta ka?
User: ayos naman ate. medyo busy lang sa work
AI: Anong work mo?
User: social media manager ako for a small business. yung owner medyo mahirap kausap minsan kasi gusto nya lagi sya ang tama
AI: May specific time ba na nahirapan ka sa kanya?
User: oo nung nagpost ako ng content na hindi nya gusto. nagalit sya sa group chat in front of everyone. sinabi nya pangit daw ang design ko
AI: Ang sakit naman nun. Anong ginawa mo?
User: hindi ko sya nireplyan sa group chat. hinintay ko sya kumalmot. then i messaged her privately. sabi ko i understand your concern po, can we discuss what style you prefer? then ginawa ko ng list ng mga gusto nya para reference for future posts
AI: Paano naman naging outcome?
User: she appreciated na hindi ko sya kinompront sa harap ng iba. naging mas okay na yung communication namin. ngayon lagi nya sinasabi sa iba na ang galing ko daw mag handle ng feedback
AI: Anong natutunan mo sa experience na yun?
User: na kapag galit ang tao, wag mong igaas pa. calm lang. then address it privately. and always offer a solution, hindi lang complaint`
  },

  {
    id: 'PER-07',
    category: 'Personal',
    description: 'Disability navigation — getting accessible transport in Manila',
    expected_skills: ['SK4:intermediate', 'SK5:intermediate', 'SK2:basic', 'SK8:basic'],
    expected_min_skills: 3,
    should_not_flag_gaming: true,
    transcript: `AI: Tell me about a challenge you've faced recently.
User: getting around manila in a wheelchair is a nightmare. no ramps, jeepneys are impossible, MRT elevators always broken
AI: How do you manage?
User: i mapped out all the accessible routes. i know which malls have working elevators, which intersections have ramps. i share this info in our PWD facebook group. now we have a crowdsourced accessibility map with over 500 locations rated
AI: You created that?
User: me and 3 other wheelchair users started it. we take photos and rate each place. businesses started contacting us to improve their accessibility so they get better ratings. one restaurant even built a ramp after we posted about them
AI: That's incredible. What motivated you to start this?
User: frustration. i was tired of being stuck because of bad infrastructure. i figured if i cant change the system, at least i can help people navigate it. and maybe embarrass some businesses into doing better
AI: What has this taught you?
User: that small actions add up. our map is now used by thousands of PWDs in metro manila. it started because i was angry about one broken elevator`
  },

  // ============================================================
  // CATEGORY 3: GAMING ATTEMPTS (5 scenarios — should flag)
  // ============================================================

  {
    id: 'GAM-01',
    category: 'Gaming',
    description: 'Buzzword-heavy corporate speak with no specifics',
    expected_skills: [],
    expected_min_skills: 0,
    should_flag_gaming: true,
    transcript: `AI: Can you tell me about a challenge you faced?
User: I leveraged my cross-functional communication skills to drive stakeholder alignment across multiple business units resulting in 40% improvement in KPI delivery
AI: Can you tell me more about what specifically happened?
User: I utilized my emotional intelligence and adaptive leadership capabilities to navigate complex organizational dynamics and deliver transformational outcomes
AI: What exactly did you do? Like, what was the situation?
User: The situation required strategic problem-solving and innovative thinking to overcome systemic challenges in the operational framework
AI: Can you give me one specific example with real details?
User: I implemented a comprehensive communication strategy leveraging best practices and industry benchmarks to optimize team performance`
  },

  {
    id: 'GAM-02',
    category: 'Gaming',
    description: 'Copied from a "how to answer interview questions" website',
    expected_skills: [],
    expected_min_skills: 0,
    should_flag_gaming: true,
    transcript: `AI: Tell me about a time you solved a problem.
User: In my previous role, I identified a critical bottleneck in our supply chain process. I gathered data from multiple stakeholders, analyzed the root cause, developed three alternative solutions, presented them to leadership, and implemented the optimal solution which reduced processing time by 35% and saved the company $200,000 annually.
AI: That sounds impressive. Can you tell me about the people involved? Who was there?
User: The key stakeholders included the VP of Operations, the Supply Chain Director, two team leads, and representatives from our partner organizations. I facilitated cross-functional meetings to ensure alignment.
AI: What was the hardest moment for you personally?
User: The most challenging aspect was managing the change resistance from legacy team members while maintaining morale and ensuring a smooth transition to the new process framework.`
  },

  {
    id: 'GAM-03',
    category: 'Gaming',
    description: 'Inconsistent details — story changes when probed',
    expected_skills: [],
    expected_min_skills: 0,
    should_flag_gaming: true,
    transcript: `AI: Tell me about a time you helped someone.
User: i helped my coworker finish a big project last month. we worked together for 3 days straight
AI: Where were you working at the time?
User: at a call center in makati
AI: What was the project about?
User: it was a marketing campaign for our client
AI: I thought you said you work at a call center? What kind of marketing campaign?
User: oh i mean it was a special project they gave us. not really marketing. more like training materials
AI: What specifically did you do to help your coworker?
User: i dont remember the details exactly. it was a while ago. but i know i helped a lot and she was grateful
AI: You said it was last month though?
User: oh right. well the details are fuzzy`
  },

  {
    id: 'GAM-04',
    category: 'Gaming',
    description: 'Only positive outcomes, no struggles — suspiciously perfect',
    expected_skills: ['SK2:basic'],
    expected_min_skills: 0,
    should_flag_gaming: true,
    transcript: `AI: Tell me about a challenge at work.
User: there was a problem with our system. i fixed it immediately and everyone was happy
AI: What was the problem specifically?
User: the database crashed. i knew exactly what to do. i fixed it in 5 minutes
AI: Was there anything messy or imperfect about how it went?
User: no everything went perfectly. i always know what to do in these situations
AI: Have you ever had a situation that didn't go well?
User: honestly no. i always handle things well. my boss always praises me. i never make mistakes at work
AI: Even when you were new and learning?
User: even then. i pick things up very fast. im naturally good at everything i do`
  },

  {
    id: 'GAM-05',
    category: 'Gaming',
    description: 'Vague and deflecting — avoids all specifics',
    expected_skills: [],
    expected_min_skills: 0,
    should_flag_gaming: true,
    transcript: `AI: What do you do for work?
User: different things
AI: Can you tell me about one specific job or task?
User: just the usual stuff you know
AI: What happened recently where you had to handle something?
User: oh you know how it is. things happen. i deal with it
AI: Can you give me one example? Even a small one?
User: hmm not really. its all pretty normal. nothing special
AI: What about outside of work? Anything interesting going on?
User: not really. same same
AI: Is there something from school or community maybe?
User: nah`
  },

  // ============================================================
  // CATEGORY 4: COMMUNITY / EDUCATION (5 scenarios)
  // ============================================================

  {
    id: 'COM-01',
    category: 'Community',
    description: 'Barangay health worker during COVID — community trust building',
    expected_skills: ['SK2:advanced', 'SK1:intermediate', 'SK3:intermediate', 'SK8:intermediate'],
    expected_min_skills: 4,
    should_not_flag_gaming: true,
    transcript: `AI: Tell me about something meaningful you've been involved in.
User: i was a volunteer barangay health worker during covid. our area had very low vaccination rate because people were scared of the vaccine
AI: What did you do?
User: i went door to door. not to convince but to listen first. people told me they saw scary posts on facebook about side effects. so i didnt argue with them. i just shared my own experience — i got vaccinated, my family got vaccinated, we were fine
AI: How did people respond?
User: slowly they trusted me. because i live in the same barangay, they know me. its different from a doctor in a hospital telling them. im their neighbor. i also connected with the older lolas first because everyone listens to the lolas
AI: Was there anyone particularly hard to convince?
User: yes one family was really against it. they believed conspiracy theories. i visited them 5 times. i never argued. just asked questions about their concerns. on the 5th visit the father said okay for the children but not for himself. i said thats fine, one step at a time. eventually he got vaccinated too
AI: What did this teach you?
User: that trust is built person by person. you cant convince people with data if they dont trust you first. and that listening is more powerful than lecturing`
  },

  {
    id: 'COM-02',
    category: 'Community',
    description: 'Student organizing accessible campus event',
    expected_skills: ['SK3:intermediate', 'SK4:intermediate', 'SK8:intermediate', 'SK2:basic'],
    expected_min_skills: 3,
    should_not_flag_gaming: true,
    transcript: `AI: What have you been working on lately?
User: i organized an event at our university for PWD awareness week. i'm a PWD student myself
AI: What was involved in organizing it?
User: first i had to convince the student council to fund it. they said there's no budget. so i found 3 sponsors from local businesses. then i had to make sure the venue was accessible — checked for ramps, sign language interpreters, large print materials
AI: Were there any problems?
User: the original venue had no elevator and our keynote speaker uses a wheelchair. so 2 days before the event i had to find a new venue. i called 8 places. finally a hotel offered their conference room for free when i explained it was for PWD awareness
AI: How did the event go?
User: 200 people came. twice what we expected. the keynote speaker cried because she said it was the first fully accessible event she attended in the philippines. we got media coverage and now the university has a permanent accessibility committee
AI: That's amazing!
User: the best part was 15 non-PWD students signed up to volunteer for accessibility improvements on campus. it changed how people see us`
  },

  {
    id: 'COM-03',
    category: 'Community',
    description: 'Church volunteer teaching Sunday school — working with children',
    expected_skills: ['SK2:intermediate', 'SK1:basic', 'SK3:basic'],
    expected_min_skills: 2,
    should_not_flag_gaming: true,
    transcript: `AI: Do you do any community or volunteer work?
User: i teach sunday school at our church. 15 kids ages 6-10
AI: What's that like?
User: fun but challenging! kids dont sit still. i had to make the lessons interactive. we do role playing, drawing, singing. not just lecturing
AI: Tell me about a specific time that was challenging.
User: one boy always disrupted the class. hitting other kids, throwing things. other teachers wanted to ask him to leave. but i noticed he only acted up when we were doing reading activities. turns out he couldnt read well and was embarrassed
AI: What did you do?
User: i paired him with an older kid as a buddy. the buddy reads with him quietly. and i started adding more visual and activity-based lessons. he calmed down a lot. his mom thanked me — she said he actually wants to come to sunday school now
AI: What did that teach you?
User: that bad behavior usually has a reason. and that if you look for the reason instead of just punishing, you can actually help`
  },

  {
    id: 'COM-04',
    category: 'Education',
    description: 'Dropped out of college, self-taught programmer',
    expected_skills: ['SK6:advanced', 'SK4:intermediate', 'SK5:intermediate'],
    expected_min_skills: 3,
    should_not_flag_gaming: true,
    transcript: `AI: Tell me about your education journey.
User: i dropped out of college year 2. we couldnt afford it anymore. i was devastated. all my classmates graduated and got jobs
AI: What did you do after dropping out?
User: for 6 months i did nothing. just felt sorry for myself. then my cousin showed me freecodecamp. i started learning web development. every day, 4-5 hours, for a year straight
AI: Did you stick with it?
User: yes. i built a portfolio of 10 projects. none of them were paid — i just built things to learn. a todo app, a weather app, eventually a full ecommerce site for a friend's business for free just to have something real to show
AI: How did you get your first paying job?
User: i applied to 50 companies. got rejected by 48. most said no degree, no interview. finally one startup gave me a coding test. i passed. they hired me. that was 3 years ago. now im a senior developer there
AI: Looking back on dropping out?
User: it was the hardest thing that happened to me. but it forced me to be resourceful and self-driven. honestly i learned more teaching myself than i ever did in school. not everyone needs a degree to prove they can do the job`
  },

  {
    id: 'COM-05',
    category: 'Education',
    description: 'OFW returned home, started a cooperative',
    expected_skills: ['SK3:advanced', 'SK4:advanced', 'SK2:intermediate', 'SK7:intermediate'],
    expected_min_skills: 4,
    should_not_flag_gaming: true,
    transcript: `AI: What's your work background?
User: i was an OFW in dubai for 8 years. domestic helper. saved every peso. came back and started a livelihood cooperative in our municipality with other returnee OFWs
AI: How did you start the cooperative?
User: gathered 15 OFW returnees. each contributed 10,000 pesos as capital. we registered with CDA. then started a catering business and a small lending program for members
AI: What challenges did you face?
User: trust was the biggest issue. some members thought i would run away with the money. so i set up complete transparency — every peso documented, monthly meetings where everyone sees the books, rotating treasurer so no one person controls the money
AI: How is it doing now?
User: 3 years in, we have 45 members, a catering business that serves 3 schools, and our lending program has helped 20 members start small businesses. none of the loans have defaulted because we all know each other and hold each other accountable
AI: What's the most important thing you've learned?
User: that filipinos are incredibly hardworking and trustworthy when you give them the right structure. the problem is never the people — its the system. create a fair system and people will rise to it`
  },

  // ============================================================
  // CATEGORY 5: DIVERSE CONTEXTS (6 scenarios)
  // ============================================================

  {
    id: 'DIV-01',
    category: 'Diverse',
    description: 'LGBTQ+ person navigating workplace discrimination',
    expected_skills: ['SK1:intermediate', 'SK5:intermediate', 'SK2:intermediate', 'SK8:basic'],
    expected_min_skills: 3,
    should_not_flag_gaming: true,
    transcript: `AI: What has your work experience been like?
User: im trans. finding work in the philippines is hard. most companies reject me in the interview when they see me
AI: I'm sorry to hear that. How have you handled that?
User: at first i was angry and hopeless. then i started focusing on industries that are more accepting — BPO, creative, tech. i also built my skills so that my work speaks louder than their prejudice
AI: Can you tell me about a specific work experience?
User: at my current BPO company, a supervisor called me by my deadname in front of the whole team. i was humiliated. but instead of quitting i went to HR. filed a formal complaint. HR talked to the supervisor and he apologized
AI: Was it hard to go to HR?
User: terrifying. but i told myself if i dont stand up, the next trans employee will go through the same thing. now the company has a policy about using chosen names. i helped write it
AI: What drives you?
User: proving that trans people can be excellent employees. i was top performer last quarter. my quality scores are highest on the floor. i want them to see me as a professional first`
  },

  {
    id: 'DIV-02',
    category: 'Diverse',
    description: 'Senior citizen learning technology — digital literacy journey',
    expected_skills: ['SK6:intermediate', 'SK5:intermediate', 'SK4:basic'],
    expected_min_skills: 2,
    should_not_flag_gaming: true,
    transcript: `AI: What's been happening in your life lately?
User: im 62 and learning how to use computer. my grandchildren are teaching me
AI: How's that going?
User: very hard! i keep pressing the wrong buttons. my grandson gets impatient with me sometimes. but i practice every day
AI: What made you want to learn?
User: pandemic. i couldnt see my family because everything was online. i felt left out. and i wanted to help in our barangay's covid response but everything was in google forms and group chats
AI: Have you been able to use what you've learned?
User: yes! now i can video call my daughter in canada. i manage our senior citizens association's facebook page. i even help other seniors in our barangay learn basic phone and computer skills
AI: What's been the most surprising thing about learning technology?
User: that its not as scary as i thought. the hardest part was starting. and my grandchildren are more patient now because they see how hard im trying. my grandson said lola you learned faster than my classmate! that made my day`
  },

  {
    id: 'DIV-03',
    category: 'Diverse',
    description: 'Former drug user, now rehabilitation volunteer',
    expected_skills: ['SK1:advanced', 'SK5:advanced', 'SK2:intermediate', 'SK3:intermediate'],
    expected_min_skills: 4,
    should_not_flag_gaming: true,
    transcript: `AI: Tell me about something you're proud of.
User: im 5 years clean from drugs. and now i volunteer at the same rehab center that helped me
AI: That's a significant achievement. What's your role there?
User: i share my story with new patients. many of them think recovery is impossible. but when they see someone who went through it and came out the other side, it gives them hope
AI: What do you actually do with them?
User: i facilitate group sessions twice a week. help them identify their triggers. teach them the coping strategies i learned. sometimes i just sit and listen because thats what they need most — someone who understands without judging
AI: Is it ever hard emotionally?
User: yes. some patients relapse and i feel like i failed them. but my counselor taught me that recovery is not linear. last month one patient who relapsed 3 times finally completed the program. he said my story kept him coming back
AI: What has this journey taught you?
User: that your worst chapter can become your greatest purpose. and that helping others is the best way to maintain your own recovery. every time i see someone get clean, it reminds me why i have to stay clean too`
  },

  {
    id: 'DIV-04',
    category: 'Diverse',
    description: 'Young person caring for sibling with autism',
    expected_skills: ['SK1:intermediate', 'SK5:intermediate', 'SK2:basic', 'SK4:basic'],
    expected_min_skills: 3,
    should_not_flag_gaming: true,
    transcript: `AI: What's been going on in your life?
User: my younger brother has autism. i take care of him after school because both parents work
AI: What's that like?
User: some days are fine. other days he has meltdowns. the hardest is in public because people stare and say things
AI: Can you tell me about one specific time?
User: we were in the grocery and he had a meltdown because they moved his favorite cereal to a different shelf. he was screaming and lying on the floor. a woman said to her friend sayang naman ang bata
AI: How did you handle that?
User: i ignored the woman. knelt down next to my brother. used our routine — counted to 10 with him, deep breaths, then showed him the cereal on the new shelf. it took 15 minutes but he calmed down. i was embarrassed but i didnt show it
AI: How do you stay patient?
User: i remind myself that he experiences the world differently. what seems small to us is overwhelming for him. and hes my brother. i love him. i learned his patterns so i can usually prevent meltdowns now — i prepare him before we go out about what might be different`
  },

  {
    id: 'DIV-05',
    category: 'Diverse',
    description: 'Indigenous person preserving cultural knowledge — teaching younger generation',
    expected_skills: ['SK2:intermediate', 'SK8:advanced', 'SK6:basic', 'SK7:basic'],
    expected_min_skills: 3,
    should_not_flag_gaming: true,
    transcript: `AI: What's something meaningful you're involved in?
User: im from the ifugao tribe. im teaching young people in our community the traditional rice terrace farming techniques before they are lost
AI: What prompted you to start this?
User: our rice terraces are 2000 years old but young people are leaving for manila. they think farming is backward. if we lose this generation, the knowledge dies with us
AI: How do you teach them?
User: i started a weekend program. not just farming techniques but the whole cultural system — the rituals, the water management, the community cooperation. i teach them that this is engineering that UNESCO recognizes, not backward farming
AI: Has it been effective?
User: 12 young people completed the first year. 3 of them decided to stay and farm instead of going to manila. one is now teaching alongside me. the others who went to manila still come back for planting and harvest season
AI: What does this mean to you?
User: everything. our identity is in these terraces. if we lose them, we lose who we are. but i also learned that you cant force young people. you have to show them the value in a way they understand. so i also taught them to document our techniques on social media. one student's tiktok about ifugao farming got 2 million views`
  },

  {
    id: 'DIV-06',
    category: 'Diverse',
    description: 'Person recovering from domestic abuse — rebuilding life',
    expected_skills: ['SK1:advanced', 'SK5:advanced', 'SK4:intermediate'],
    expected_min_skills: 3,
    should_not_flag_gaming: true,
    transcript: `AI: Is there something you'd like to share about what you've been through?
User: i left an abusive marriage 2 years ago. starting over with nothing is the hardest thing ive done
AI: That takes incredible courage. How did you rebuild?
User: first i went to a shelter with my kids. the social workers helped me get a protection order. then i found a small room to rent near my sister. she watched the kids while i worked as a kasambahay during the day and took virtualahan training at night
AI: How did you manage all of that?
User: one day at a time. i made a plan — 6 months of kasambahay work to save up, then transition to virtual assistant work. i stuck to the plan even when i was exhausted. the virtualahan community helped a lot — other women going through similar things
AI: Where are you now?
User: im a virtual assistant for 2 clients now. i rent a proper apartment. my kids are in school. last month my older daughter said mama youre so strong. i cried because i dont feel strong. i just did what i had to do
AI: What would you tell someone in a similar situation?
User: that leaving is the hardest step but also the first step to getting your life back. and that you are stronger than you think. i went from having nothing to building a life for my family in 2 years. if i can do it, anyone can`
  },
];

module.exports = { SCENARIOS };
