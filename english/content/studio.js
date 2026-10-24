/**
 * English Studio: original fictional practice, not copied publisher transcripts.
 * Listening scripts are designed exercises. Device TTS is synthetic speech, not
 * a natural recording or an accent/prosody reference. Use the publisher links
 * for human speech. These tasks are not calibrated CEFR tests or native scores.
 * All characters, projects, and situations below are fictional or generic.
 */
const question = (id, prompt, options, answer, explanation) => ({ id, prompt, options, answer, explanation });

export const listening = [
  {
    id: 'listen-01', title: 'A deadline is not a promise', scene: '同事讨论一份报告的交付范围。',
    focus: '听懂保留意见、范围调整与最终承诺', minutes: 10,
    script: `Manager: Could we have the full report tomorrow? It would be useful for the planning meeting.
Analyst: Tomorrow is quite an ask. I can give you the headline findings, but the comparison section still needs checking. I'd rather flag that now than send something that looks finished and isn't.
Manager: Fair enough. Would a short briefing get us through the meeting?
Analyst: I think so, provided we're clear that the numbers are provisional. I can put the main finding and the two biggest uncertainties on one page by noon.
Manager: That works. Let's leave the full version until Friday.
Analyst: Friday afternoon is realistic. If the missing responses arrive earlier, I'll bring it forward, but I wouldn't plan around that.
Manager: Understood. I'll tell the group we're discussing the direction tomorrow, not signing off the final report.`,
    questions: [
      question('listen-01-q1', 'What is the analyst doing with “Tomorrow is quite an ask”?', ['Accepting the deadline enthusiastically.', 'Politely signalling that the request is demanding.', 'Asking which day tomorrow is.', 'Rejecting any involvement in the report.'], 1, '后面立即说明只能交主要发现，说明这是对时间要求的缓和异议，并不是确认完整报告能交。'),
      question('listen-01-q2', 'What is actually promised for tomorrow?', ['A checked comparison section before the meeting.', 'The full report with all responses included.', 'A one-page briefing by noon with uncertainty made explicit.', 'A final decision on the report by Friday morning.'], 2, '承诺是中午前交一页简报，含主要发现和两个最大不确定性；完整报告预计周五下午。'),
      question('listen-01-q3', 'Why does the analyst say “I wouldn\'t plan around that”?', ['An earlier delivery is possible but should not become the expected deadline.', 'The manager should cancel the planning meeting.', 'The missing responses are no longer useful.', 'Friday has become an impossible deadline.'], 0, 'that 指“回复提前到达后可能提前交付”。说话人明确区分可能发生与可依赖的承诺。'),
    ],
    noticing: ['Quite an ask 承认要求较高，后面需要具体边界才能避免只显得不合作。', 'Provided 后接接受方案的条件；不是无条件的 yes。', 'I wouldn’t plan around that 限制对方怎样使用一条乐观信息。'],
  },
  {
    id: 'listen-02', title: 'The opening behind the small talk', scene: '两位同事在活动结束后闲聊。',
    focus: '接住对方提供的话题线索，不把闲聊变成问卷', minutes: 9,
    script: `Colleague A: Did you get up to anything over the weekend?
Colleague B: Nothing particularly impressive. I tried a pottery class and produced something that's technically a bowl.
Colleague A: Technically?
Colleague B: It holds things. Whether you'd want it on your table is another question. Still, it was nice to do something where I couldn't check my phone every two minutes.
Colleague A: I could do with that. Was it one of those courses where everyone already knows what they're doing?
Colleague B: Thankfully, no. The person next to me managed to attach their sleeve to the clay, so I felt in good company. They run beginner sessions on Saturdays.
Colleague A: That sounds more my speed. If you remember the name, send it over sometime.
Colleague B: Will do. Have you tried anything like that before?`,
    questions: [
      question('listen-02-q1', 'What does “technically a bowl” achieve here?', ['It corrects a technical definition.', 'It complains about the instructor.', 'It makes a modest joke about the speaker’s own result.', 'It announces that the class was unsuitable.'], 2, '后文承认能装东西，但未必想摆在桌上。这里的自我调侃让闲聊轻松，而非严肃评价课程。'),
      question('listen-02-q2', 'What attracted Colleague A beyond making pottery?', ['A break from repeatedly checking a phone.', 'A qualification for advanced pottery.', 'The chance to teach beginners on Saturdays.', 'A guaranteed attractive bowl.'], 0, 'I could do with that 紧接“不用每两分钟看手机”，表明这也是 A 感兴趣的体验。'),
      question('listen-02-q3', 'Which interpretation of “send it over sometime” is best supported?', ['A wants an immediate booking made on their behalf.', 'A is definitely joining the next Saturday session.', 'A is ending the friendship politely.', 'A would welcome the course details without imposing urgency.'], 3, '它是低压力地索取信息；没有证据说明已经报名，或者要求对方马上操作。'),
    ],
    noticing: ['Technically 在这个语境中拉开字面合格与实际品质的距离；TTS 不一定表现这种轻松语气。', 'I could do with… 表达自己也需要某种体验，自然承接前一人的话。', 'More my speed 表示更适合自己的能力或节奏，不一定在谈速度。'],
  },
  {
    id: 'listen-03', title: 'A promising result, a smaller claim', scene: '研究讨论中的因果推断。',
    focus: '区分观察、解释和建议；听懂有建设性的质疑', minutes: 11,
    script: `Presenter: People who used the new booking form submitted their requests faster, so the form clearly saves time.
Reviewer: It may well do. I'm not sure the comparison gets us all the way there, though. Didn't people choose which form to use?
Presenter: They did. The new one was optional during the trial.
Reviewer: Then the early users might already have been more comfortable with the process. I'm not saying the result is meaningless. I'd just describe it as encouraging rather than conclusive.
Presenter: So you would hold off on rolling it out?
Reviewer: Not necessarily. A small rollout could be sensible. I'd keep the old option available and compare similar kinds of requests before making a stronger claim.
Presenter: Right. We can recommend the next test without pretending the first one settled the question.`,
    questions: [
      question('listen-03-q1', 'What is the reviewer’s main objection?', ['The new form cannot possibly save time.', 'The comparison may reflect who chose each form.', 'The trial measured no useful outcome.', 'Optional forms are always inappropriate.'], 1, '使用者自行选择表单，组间可能本来就不同；这削弱因果断言，不等于否定观察结果。'),
      question('listen-03-q2', 'What next step does the reviewer support?', ['Remove the new form immediately.', 'Replace the old form without further comparison.', 'Wait until every possible uncertainty is removed.', 'Try a limited rollout while preserving a comparison option.'], 3, '明确支持小范围继续试，同时保留旧选项并比较相似请求。'),
      question('listen-03-q3', 'What does “It may well do” contribute to the response?', ['It leaves the proposed benefit open before challenging the evidence.', 'It confirms the effect has already been proved.', 'It changes the subject to a different product.', 'It means the reviewer did not hear the claim.'], 0, '先承认结论可能为真，再检查证据是否足以支持；对结论的开放态度与对证据的严格要求可以并存。'),
    ],
    noticing: ['Gets us all the way there 指证据是否足以走到那个结论。', 'I’m not saying… followed by I’d just… 用来精确界定反对的范围。', 'Not necessarily 否定对方的过度推论，不等于承诺相反结论。'],
  },
  {
    id: 'listen-04', title: 'Repairing the message', scene: '两人发现对“接手一份文件”的理解不同。',
    focus: '修正措辞、确认共同理解与任务归属', minutes: 9,
    script: `Editor: I thought you were taking over the proposal this week, so I told the team to send their comments to you.
Writer: Ah, I can see how that came across. When I said I'd pick it up, I meant I'd revise the opening section, not coordinate the whole document.
Editor: Right. I took “pick it up” rather broadly.
Writer: That's on me; I should have been more specific. I'm happy to collect comments on the opening, but I don't have room to manage everyone's changes before Thursday.
Editor: No problem. I'll keep the overall coordination. Could you send me your revised opening by Wednesday afternoon?
Writer: Yes. And just so we're on the same page, you'll decide which of the wider comments make it into the final version?
Editor: Exactly. I'll clarify that with the team.`,
    questions: [
      question('listen-04-q1', 'Why does the writer say “I can see how that came across”?', ['To insist that the editor deliberately misunderstood.', 'To withdraw from all work on the proposal.', 'To acknowledge that their own wording allowed another interpretation.', 'To claim the proposal is already finished.'], 2, '这句话先承认措辞可能造成误解，随后给出原意；没有把全部责任推给对方。'),
      question('listen-04-q2', 'Who will coordinate the full proposal?', ['The editor.', 'The writer.', 'Every team member separately.', 'No one until Thursday.'], 0, 'Editor 明说“I’ll keep the overall coordination”，Writer 负责周三下午前交修改后的开头。'),
      question('listen-04-q3', 'What is the purpose of the final question?', ['To reopen the disagreement about the original wording.', 'To request more time for the opening section.', 'To reject comments from other team members.', 'To confirm who decides on changes beyond the opening.'], 3, 'just so we’re on the same page 引出最后一次具体核对，让修改决定的归属清楚。'),
    ],
    noticing: ['Pick it up 在缺少对象范围时容易产生歧义；清楚比使用口语短语本身更重要。', 'That’s on me 承认自己这一部分责任，不必接着承担原来未答应的任务。', '最后确认一个可执行细节，比笼统说“懂了”更可靠。'],
  },
  {
    id: 'listen-05', title: 'Not this weekend', scene: '朋友请求周末帮忙，另一人需要拒绝。',
    focus: '辨认礼貌拒绝与真实替代方案', minutes: 9,
    script: `Friend A: Any chance you could help me move on Saturday? Even a couple of hours would make a difference.
Friend B: I'd love to be useful, but Saturday's pretty much spoken for. I've promised my sister I'd look after the kids, and I can't really move that around.
Friend A: Of course. I thought it was worth asking.
Friend B: I'm free on Friday evening, though. I could help pack the kitchen if that would take something off your plate.
Friend A: Actually, that might be the more useful bit. The boxes are here, but I've barely started.
Friend B: Great. I can come around six and stay until eight. I won't be much use carrying the sofa the next morning, unfortunately.
Friend A: No sofa duties. Just mugs, plates, and whatever mysterious things are at the back of the cupboard.`,
    questions: [
      question('listen-05-q1', 'Is Friend B agreeing to help with the move on Saturday?', ['Yes, for two hours after childcare.', 'No; the Saturday commitment is not available to change.', 'Yes, but only with small boxes.', 'It remains undecided until Friday evening.'], 1, 'but 后明确说明周六已有不可调整的承诺；后来的答应是周五打包，不是周六搬家。'),
      question('listen-05-q2', 'What specific help is offered?', ['Packing the kitchen on Friday from six until eight.', 'Carrying the sofa on Saturday morning.', 'Buying boxes on Friday afternoon.', 'Looking after the children on Saturday.'], 0, '时间、任务和边界都直接说出：周五六点到八点，帮厨房打包。'),
      question('listen-05-q3', 'What does “take something off your plate” mean here?', ['Remove unwanted dishes from the kitchen.', 'Pay for dinner after the move.', 'Reduce part of the friend’s workload.', 'Decide which possessions the friend should keep.'], 2, '这里是减轻待办负担；后文虽然真的谈到盘子，也不能把习惯表达机械译成实物动作。'),
    ],
    noticing: ['Spoken for 指时间或资源已有安排。', '替代方案写清能做什么，不会自动推翻之前的拒绝。', 'Worth asking 表示接受这次未能得到原方案的答复；不必追加过度道歉。'],
  },
  {
    id: 'listen-06', title: 'A very quiet evening', scene: '朋友回顾一场有点失控的晚餐。',
    focus: '依据上下文理解反话，避免只凭一个词猜语气', minutes: 10,
    script: `Friend A: So, how was your supposedly quiet dinner?
Friend B: Oh, wonderfully peaceful. The smoke alarm went off halfway through, the cat stole a piece of fish, and we discovered we'd invited two people who had just had an argument.
Friend A: A relaxing evening, then.
Friend B: Exactly. To be fair, once we opened the windows and abandoned the fish, it got better. We ordered noodles, and the two guests found something else to disagree about: the best route to the station.
Friend A: Did you ever get to sit down?
Friend B: Eventually. And everyone stayed late, which I'm choosing to take as a good sign. Next time, though, I'm keeping the food simple.
Friend A: Or calling it a chaotic dinner from the start. Then you can exceed expectations.
Friend B: Finally, a hosting strategy I can manage.`,
    questions: [
      question('listen-06-q1', 'How should “wonderfully peaceful” be interpreted?', ['As a literal description of a quiet meal.', 'As a request to stop asking questions.', 'As proof that the guests did not speak.', 'As a playful contrast with the mishaps that follow.'], 3, '烟雾报警、猫偷鱼和客人争执都与 peaceful 相反；判断依据来自连续内容，而非假定 TTS 有讽刺语调。'),
      question('listen-06-q2', 'What happened to the original meal?', ['It was served after the windows were closed.', 'The fish was abandoned and noodles were ordered.', 'The guests cooked a second fish.', 'Only the two arguing guests refused it.'], 1, '说话人交代开窗、放弃鱼、点面条；题目考具体顺序而非总体情绪。'),
      question('listen-06-q3', 'What is the speaker’s overall attitude by the end?', ['Amused by the mess and willing to host again with a simpler plan.', 'Convinced that the friendships are over.', 'Certain that every guest disliked the evening.', 'Determined to make the next dinner more elaborate.'], 0, '朋友们待到很晚被当作积极迹象，说话人还计划下次简化菜单，显示并非彻底沮丧。'),
    ],
    noticing: ['To be fair 常引出对前面负面叙述的修正或补充。', 'I’m choosing to take that as… 暗示这是一种愿意采取的解释，不是确定事实。', '同样的词可以表达不同态度；本练习不能替代真人语调辨别。'],
  },
  {
    id: 'listen-07', title: 'The point behind the story', scene: '短演讲用一个生活片段解释自己的看法。',
    focus: '听出故事服务的论点，而非把细节当结论', minutes: 11,
    script: `Speaker: I used to think a good explanation was one that left nothing out. Then a friend asked me how to keep a houseplant alive. I gave her a detailed account of soil, drainage, light, and seasonal growth. She listened patiently and then said, “Right, but what do I do tomorrow?” That was a useful, slightly uncomfortable question. She wasn't asking for everything I knew. She needed a decision she could act on. These days, I try to give the immediate answer first, then add the background if it changes the choice. That doesn't mean pretending things are simple when they aren't. It means deciding which complexity matters to this person, at this moment. The plant, incidentally, survived. I suspect moving it out of the dark corner helped more than my lecture did.`,
    questions: [
      question('listen-07-q1', 'What is the main point of the story?', ['Houseplants require expert supervision.', 'People should avoid detailed explanations altogether.', 'An explanation should serve the listener’s immediate need.', 'Good explanations always end with a joke.'], 2, '故事的转折是朋友需要“明天做什么”；讲者由此强调先回应听众当前问题，再补影响选择的复杂性。'),
      question('listen-07-q2', 'What question made the speaker reconsider their approach?', ['What should I actually do tomorrow?', 'How much did the plant cost?', 'Why do plants grow differently in winter?', 'Can you explain the science in more detail?'], 0, '朋友没有索取更多知识，而是在追问具体行动。'),
      question('listen-07-q3', 'Which advice would the speaker most likely support?', ['Hide all uncertainty until the end.', 'Answer the practical question, then explain relevant qualifications.', 'Give the same complete explanation to every audience.', 'Avoid background information even when it changes the decision.'], 1, '讲者明确保留会影响选择的背景信息；简明并不等于删掉重要限定。'),
    ],
    noticing: ['Incidentally 把最后的植物细节标成旁支，主旨此前已经完成。', 'That doesn’t mean… 提前限制听众可能作出的过度概括。', '复述时先说观点，再用一个故事细节支持；不要按原文逐句回放。'],
  },
  {
    id: 'listen-08', title: 'Who is doing what?', scene: '会议结束前快速确认分工。',
    focus: '追踪条件、代词指向和未被承诺的任务', minutes: 10,
    script: `Coordinator: Before we finish, can we pin down the next steps? The venue needs our numbers by Tuesday.
Designer: I can update the invitation today, assuming the programme isn't changing again.
Coordinator: The morning session is fixed. The afternoon speaker hasn't confirmed, so leave that slot described as a discussion for now.
Assistant: I'll send the invitation once the updated version lands. Should I chase people who haven't replied as well?
Coordinator: Not yet. Give them until Monday morning. I'll handle the reminders after that.
Designer: And the numbers for the venue?
Coordinator: I'll send those on Tuesday. If we get a few late replies, we'll deal with them separately rather than hold up the whole list.
Assistant: Fine. So I'm sending the invitation, you're following up and confirming the numbers, and the afternoon description stays general until we hear back.`,
    questions: [
      question('listen-08-q1', 'What does “pin down” mean in this meeting?', ['Make the responsibilities precise before leaving.', 'Move every task to a later date.', 'Add more people to the guest list.', 'Stop discussing the invitation design permanently.'], 0, '随后的对话逐项确认谁做什么、什么时候做；pin down 指把尚模糊的安排明确下来。'),
      question('listen-08-q2', 'Who will send reminders after Monday morning?', ['The designer.', 'The assistant.', 'The unconfirmed speaker.', 'The coordinator.'], 3, 'Coordinator 说“I’ll handle the reminders after that”，Assistant 的任务是发送邀请。'),
      question('listen-08-q3', 'How will uncertainty about the afternoon speaker be handled?', ['The whole invitation will wait until the speaker confirms.', 'The invitation will use a general description for that slot.', 'The afternoon session will be removed immediately.', 'The venue will be asked to choose the speaker.'], 1, '具体做法是先写 discussion；这是把不确定部分局部处理，不让它阻塞全部流程。'),
    ],
    noticing: ['Assuming 表示行动所依赖的前提；后面需要确认前提是否成立。', 'Once the updated version lands 是收到新版后再做，不能误听成今天必发。', '最后的复述整合了三个人的任务，适合练习压缩信息。'],
  },
  {
    id: 'listen-09', title: 'An apology with a boundary', scene: '邻居就噪声问题协商一个可行安排。',
    focus: '把承认影响、解释原因和协商边界分开', minutes: 10,
    script: `Neighbour A: Sorry to knock so early. The music carried through the wall last night, and I had trouble getting to sleep.
Neighbour B: I'm sorry. I didn't realise it was that loud next door. We had a few friends over, but that's no excuse for keeping you awake.
Neighbour A: I don't expect silence all evening. It's mainly after ten that it becomes difficult, especially during the week.
Neighbour B: That's reasonable. I'll move the speaker away from the shared wall and keep it down after ten. We're having a birthday dinner next month, though. Would it help if I let you know beforehand?
Neighbour A: A heads-up would be appreciated, but it wouldn't make late noise easier. Could you still keep the same limit?
Neighbour B: Yes, fair point. Letting you know isn't the same as asking you to put up with it.`,
    questions: [
      question('listen-09-q1', 'What does Neighbour A want?', ['No visitors in the building.', 'Complete silence at every hour.', 'Less noise after ten, especially on weekdays.', 'An invitation to the birthday dinner.'], 2, 'A 直接说并非要求整晚绝对安静，关键是十点之后，尤其工作日。'),
      question('listen-09-q2', 'What physical change does Neighbour B propose?', ['Move the speaker away from the shared wall.', 'Move the dinner to another apartment.', 'Install new windows before the next party.', 'Remove the shared wall.'], 0, '这是明确提出的一个具体措施，另一个是十点后降低音量。'),
      question('listen-09-q3', 'Why does A distinguish a heads-up from the noise limit?', ['Advance notice automatically permits a later party.', 'Advance notice is unwanted in every circumstance.', 'The birthday dinner is more important than sleep.', 'Being informed does not mean agreeing to the disturbance.'], 3, 'A 接受提前告知，但没有因此同意更晚的噪声；B 最后也准确复述了这一区别。'),
    ],
    noticing: ['That’s no excuse 承认原因不等于把影响合理化。', 'Would be appreciated 表达礼貌接受，但后接 but 保留实质边界。', 'Put up with 指忍受；在最后一句中用于确认没有要求对方忍受。'],
  },
  {
    id: 'listen-10', title: 'Answering beyond the evidence', scene: '演讲结束后的追问要求比现有证据更强的结论。',
    focus: '听懂谨慎结论与明确未知，识别有限回答', minutes: 11,
    script: `Audience member: You found that people liked the shorter meetings. Does that mean every team should make the change?
Speaker: I wouldn't go that far. In our trial, the meetings were routine updates, and the team already had a shared document. A planning discussion with several unresolved issues might need a different format.
Audience member: But surely people working in smaller teams would benefit even more?
Speaker: Possibly. We didn't compare team sizes, so I can't tell you that from this trial. What I can say is that participants reported less repetition, and they still knew what they needed to do next.
Audience member: So what would you recommend to someone trying it?
Speaker: Start with one recurring meeting. Decide what a useful outcome looks like, try the shorter version, and check whether anything important gets lost. Shorter is only better if the meeting still does its job.`,
    questions: [
      question('listen-10-q1', 'What does “I wouldn\'t go that far” limit?', ['Whether anyone liked the trial.', 'The claim that the result applies to every team.', 'Whether shorter meetings are physically possible.', 'The number of questions the audience may ask.'], 1, '它限制把特定试验推广到所有团队的结论；没有收回试验参与者喜欢短会这一观察。'),
      question('listen-10-q2', 'What does the speaker explicitly say was not compared?', ['Routine updates versus informal lunches.', 'Participants with and without shared documents.', 'Larger teams versus smaller teams.', 'Meetings before and after an office move.'], 2, '听众问小团队是否更受益，讲者明确说没有比较团队规模；其他选项没有被讲者明确提为未比较的项目。'),
      question('listen-10-q3', 'What principle guides the recommendation?', ['Evaluate whether the shorter meeting still achieves its purpose.', 'Make all meetings as short as technically possible.', 'Accept favourable reports without checking outcomes.', 'Keep only meetings that involve large teams.'], 0, '结尾给出条件：更短只有在会议仍能完成任务时才更好；建议从一个例会开始验证。'),
    ],
    noticing: ['What I can say… 把未知与有依据的回答接起来，避免只剩“I don’t know”。', 'Surely 在提问中带有预期，但回答者不必接受这个预期。', 'Only better if… 是整个建议的约束条件，不是附带细节。'],
  },
  {
    id: 'listen-11', title: 'The day that went off plan', scene: '朋友讲一次意外改变安排的小旅行。',
    focus: '追踪叙事转折、时间关系和讲述者的评价', minutes: 10,
    script: `Speaker: We had this beautifully organised day planned: an early train, a walk by the river, then lunch at a place we'd booked weeks before. Naturally, we missed the train. By the time we reached the town, it was raining, and the restaurant had called to say there was a problem in the kitchen. At that point, I was ready to declare the whole thing a write-off. My friend suggested we duck into a bookshop until the rain eased. There was a reading happening upstairs, so we stayed for that, talked to a couple of people afterwards, and ended up at a tiny café they recommended. We didn't do a single thing on the original list. I'm not claiming every failed plan turns into an adventure, but that one improved once we stopped trying to rescue it.`,
    questions: [
      question('listen-11-q1', 'What was the speaker ready to do before entering the bookshop?', ['Treat the day as a complete failure.', 'Book the same restaurant again for dinner.', 'Return the books they had bought.', 'Attend the reading they had planned to see.'], 0, 'Declare the whole thing a write-off 表示觉得整天已经失败；读书会并不在原计划中。'),
      question('listen-11-q2', 'How did they find the café?', ['It was on their original itinerary.', 'The cancelled restaurant booked it for them.', 'They noticed it while walking by the river.', 'People they met after the reading recommended it.'], 3, '先在书店参加活动，之后与人交谈，再根据建议去咖啡馆，信息来源在后半段。'),
      question('listen-11-q3', 'What conclusion does the speaker actually draw?', ['Planning is always a waste of time.', 'Every cancelled plan becomes a better experience.', 'Letting go of this particular plan made room for a better day.', 'Missing trains is a reliable travel strategy.'], 2, '讲者明确拒绝“每个失败计划都变冒险”的普遍结论，只对这一次作有限反思。'),
    ],
    noticing: ['Naturally 在此叙事里带调侃，并非在解释必然因果。', 'Duck into 表示临时走进某处躲避或停留；与潜水无关。', 'I’m not claiming… 让温和的个人领悟保持边界。'],
  },
  {
    id: 'listen-12', title: 'An agreement with conditions', scene: '活动团队决定是否试行一种新安排。',
    focus: '辨别有条件支持、默认方案与取消条件', minutes: 11,
    script: `Organiser: I'd like to try an open discussion instead of three short presentations next month.
Facilitator: I'm open to it. My only hesitation is that the quieter people might get even less space if we just let the conversation run.
Organiser: What if we send the questions in advance and start with a minute for everyone to write something down?
Facilitator: That would help. I'd also want someone keeping an eye on whose voices we're hearing.
Organiser: I can do that. Are we saying yes for next month, then?
Facilitator: Yes, as a trial. Let's not announce it as the new permanent format. And if the guest speaker confirms after all, we should keep the original plan rather than squeeze everything in.
Organiser: Agreed. I'll draft both versions of the invitation, and we'll choose once we know about the guest.`,
    questions: [
      question('listen-12-q1', 'What concern lies behind the facilitator’s hesitation?', ['There are too many planned presentations.', 'An unstructured discussion may favour already vocal participants.', 'Participants refuse to prepare in advance.', 'The guest speaker has definitely cancelled.'], 1, '担忧是安静参与者在自由讨论里更难获得空间；不是反对所有讨论形式。'),
      question('listen-12-q2', 'What happens if the guest speaker confirms?', ['The team keeps the original plan.', 'The speaker joins the discussion without a presentation.', 'The entire event is cancelled.', 'Both formats are fitted into the same time slot.'], 0, '条件句说得明确：嘉宾确认后保留原计划，不把所有内容挤进同一场。'),
      question('listen-12-q3', 'What has been agreed by the end?', ['The discussion format becomes permanent.', 'The invitation can be sent immediately without another decision.', 'A conditional trial is supported, with a decision still dependent on the guest.', 'The facilitator will stop monitoring participation.'], 2, '试行获得支持，但最终采用哪版仍取决于嘉宾情况；yes 并不意味着所有条件已经消失。'),
    ],
    noticing: ['I’m open to it 表示愿意考虑，不等于毫无保留地批准。', 'My only hesitation is… 将担忧聚焦在可处理的问题上。', 'As a trial 和 if 从句同时约束了同意的范围与执行条件。'],
  },
];

export const speaking = [
  {
    id: 'speak-01', title: 'Explain a finding without overselling it', context: '向不熟悉方法的同事解释一个虚构试验。',
    prompt: 'In a three-week library trial, volunteers using a new booking form finished requests sooner. They chose whether to use it; assignment was not random. Explain what the result suggests, what it does not establish, and one useful next step. Speak to a busy colleague, not a specialist panel.', seconds: 90,
    scaffold: ['先用一句话给出有限结论：The early result looks promising, but…', '用普通词解释自行选择带来的替代解释。', '以一个具体可做的后续比较收尾，而不是罗列所有可能问题。'],
    model: `The new form looks promising: the volunteers who used it completed their requests sooner. But we should be careful about saying the form caused the improvement. People chose whether to try it, so the early users may already have been more comfortable with the booking process. That doesn't make the result useless. It gives us a reason to test the idea more carefully. I'd keep both forms available for the next round and arrange a fairer comparison between similar requests and users. We should also check whether the faster requests contain more errors. If the new form saves time without creating extra corrections, we'd have a much stronger basis for making it the default.`,
    checklist: ['第一句话包含结果及限制，听众不必等到最后才知道立场。', '没有把相关性说成已确定的因果。', '解释一个关键替代原因，而非堆术语。', '建议对应具体不确定性，且没有编造试验数字。'],
  },
  {
    id: 'speak-02', title: 'Disagree without taking over', context: '你认可同事的目标，但不同意他们的执行速度。',
    prompt: 'A colleague wants to replace all weekly updates with written notes starting tomorrow. You support reducing unnecessary meetings but think unresolved questions still need discussion. Give a constructive disagreement and invite a response.', seconds: 90,
    scaffold: ['指出真实共同目标，避免机械称赞。', '把异议限定为“全部替换、立即执行”的部分。', '提出小范围试行，再问一个开放但聚焦的问题。'],
    model: `I'm with you on cutting down the meetings that simply repeat what's already in the notes. Where I'm less convinced is replacing all of them at once. Some of our updates turn into short decisions, and a written thread may not be the quickest way to resolve those. Could we start by making the routine status update written, while keeping a brief discussion for open questions? We could try that for two weeks and see whether decisions slow down or anyone loses track of what they need to do. If it works, I'd be happy to go further. Which part of the current meeting do you think we'd miss least? That might be the easiest place to start.`,
    checklist: ['共同点具体，不是空泛的“I agree, but”。', '用理由支持异议，没有揣测对方动机。', '给出替代方案，留下对方参与调整的空间。', '结尾的问题能让对话继续，不是假问题。'],
  },
  {
    id: 'speak-03', title: 'Keep small talk moving', context: '活动间隙，对方提到刚开始学做面包。',
    prompt: 'Someone says, “I spent half the weekend trying to make bread. It came out looking more like a brick.” Respond naturally. Acknowledge the joke, add one brief related detail, and ask a follow-up that grows out of what they said. Imagine their reply before continuing.', seconds: 60,
    scaffold: ['先接住对方的情绪或调侃，不急着给专业建议。', '分享一个短而相关的细节，不把话题完全拿走。', '问具体后续，如是否还想再试，而非连续问背景资料。'],
    model: `At least you could use it as a doorstop. I've had a few cooking experiments like that, so I sympathise. I once made a cake that was beautifully brown on top and almost liquid in the middle. Were you following a recipe, or was this more of an experiment? If it was your first attempt, getting anything that resembles a loaf sounds like a start. Would you try the same recipe again, or have you had enough bread-making for a while? I'd be interested to hear what you'd change next time.`,
    checklist: ['回应了“brick”的轻松语气，未嘲笑对方本人。', '自己的故事没有长到淹没对方话题。', '后续问题来自对方提供的信息。', '实际互动时给对方时间回答，不把模型中的所有问题一次性连问。'],
  },
  {
    id: 'speak-04', title: 'Tell a story with a turn', context: '练习把普通小插曲讲得清楚、有变化。',
    prompt: 'Tell a real or clearly fictional story about a minor plan that went wrong but ended reasonably well. Establish the situation briefly, show the turning point, and finish with what made the experience worth telling. Avoid giving every event equal weight.', seconds: 90,
    scaffold: ['用一两句交代原计划。', '把最多时间留给出错与转折。', '以一个具体感受或观察结尾，不强行上升成宏大道理。'],
    model: `I once arranged to meet a friend at a café and was very pleased with myself for arriving early. After ten minutes, I sent a message asking where she was. She replied that she'd been sitting by the window for ages. It turned out the café had two branches, and we'd each gone to the one nearest home. Neither of us had checked the address. We compared our orders, discovered we'd both bought the same sandwich, and decided that at least our lunch plans were consistent. She came over after finishing her coffee. We were only half an hour late getting together, but now, whenever we arrange anything, one of us inevitably says, “Same café, or actually the same café?”`,
    checklist: ['听众很快知道人物、地点和原计划。', '转折清楚，代词和时间关系可追踪。', '有一个值得记住的细节，不靠一串高级形容词。', '结尾与故事有关，没有突然另开主题。'],
  },
  {
    id: 'speak-05', title: 'Repair it while keeping the conversation moving', context: '对方把你愿意审核误解成愿意负责整个任务。',
    prompt: 'You said, “I can take a look at the proposal.” Your colleague now believes you will rewrite the whole document by Friday. Clarify your intention, acknowledge any ambiguity, state what you can do, and check that the new agreement is clear.', seconds: 60,
    scaffold: ['I can see how that sounded… 承认表达可能模糊。', '精确区分审核、改写与总负责。', '给出能兑现的范围和时间，再确认一次。'],
    model: `I can see how that sounded broader than I meant. When I said I'd take a look, I meant I could review the main argument and flag anything unclear. I wasn't offering to rewrite the whole proposal. I can send you comments on the first two pages by Thursday afternoon, though. If you'd like me to help with a particular section after that, we can decide what fits. Just to check we're on the same page: you'll keep ownership of the draft, and I'll provide focused comments rather than a finished replacement. Would that still be useful?`,
    checklist: ['明确说出原意，没有绕开关键误解。', '边界具体且语气不指责。', '提出可以完成的帮助。', '通过最后确认防止第二次误解。'],
  },
  {
    id: 'speak-06', title: 'Make a request easy to answer', context: '向忙碌的同事请求有限的反馈。',
    prompt: 'Ask a colleague to review a short introduction before you send it to a general audience. You mainly need to know whether the opening makes sense. The colleague is busy, so specify the scope and timing, and offer an easy way to decline or suggest an alternative.', seconds: 60,
    scaffold: ['先说希望对方做的具体事，再给背景。', '明确不需要他们做的额外工作。', '用一个真实可接受的备选方案，避免假装可拒绝。'],
    model: `Could you spare ten minutes to read the introduction this week? I'm sending it to people who don't know the background, and I'd mainly like to know whether the opening makes sense without extra explanation. I'm not looking for a full edit; a note on where you first feel lost would be plenty. Thursday afternoon would help me most, but if this week is packed, just let me know. I can ask someone else or send it later. I'll put the two paragraphs in the message so you don't have to work through the whole document.`,
    checklist: ['对方能快速判断请求的成本和期限。', '反馈问题具体，而非模糊的“Any thoughts?”。', '拒绝或调整时间确实可行。', '没有用过多解释把简单请求变得沉重。'],
  },
  {
    id: 'speak-07', title: 'Warm, concise, and clear', context: '把一次安排变更写成短邮件，再换成口头表达。',
    prompt: 'Write a friendly 60–90-word email to a colleague: you need to move tomorrow’s coffee chat, you can offer Thursday morning or Friday afternoon, and either option is flexible. Then give the same message aloud in a conversational way without reading the email word for word.', seconds: 90,
    scaffold: ['邮件：一句说明变更，两种选项，一句让对方选择。', '口头：使用自然停顿和简短语块，避免读出邮件开头结尾。', '不用模糊借口或过度道歉填满篇幅。'],
    model: `Hi Alex, could we move our coffee tomorrow? Something has come up in the morning, and I don't want to keep you waiting or rush the conversation. I could do Thursday morning or Friday afternoon, but neither time is fixed at my end. If another slot works better for you, let me know and I'll see what I can shift. Sorry for the change, and thanks for being flexible.

Spoken version: Could we move our coffee tomorrow? My morning's become a bit awkward. Thursday morning or Friday afternoon would work for me, but I'm flexible. What would suit you?`,
    checklist: ['邮件包含变更、选项和明确回复入口。', '语气友好，不靠冗长客套。', '口头版保留意思，但不是逐字朗读书面句子。', '没有把灵活时间写成不可更改的最后期限。'],
  },
  {
    id: 'speak-08', title: 'Give feedback that can be used', context: '同事的介绍很认真，但听众容易在细节里迷路。',
    prompt: 'A colleague asks for feedback on a five-minute explanation. You understood the examples but could not tell the central point until the end. Give specific feedback, explain the listener effect, and suggest one revision while leaving room for the colleague’s intention.', seconds: 90,
    scaffold: ['谈自己能观察到的表现，而非给人贴标签。', '把问题与听众体验联系起来。', '只提出一个优先修改，再核对原本想表达的重点。'],
    model: `The examples were easy to picture, especially the one about the booking queue. Where I struggled was knowing what I was supposed to take from them. I only understood the main point in your final sentence, so I spent the first few minutes trying to work out how the examples connected. I'd consider moving a version of that final sentence to the beginning. Then each example can support it, rather than leaving the audience to discover the argument on their own. I wouldn't necessarily add more detail; I think the material is already there. Was your main aim to recommend a change, or to show why the issue is more complicated than it first appears?`,
    checklist: ['有具体例子，避免只有“挺好”或“太乱”。', '区分听者的体验与对说话人的评价。', '建议可以实际执行。', '最后问题允许对方澄清目的，而非强迫接受你的版本。'],
  },
  {
    id: 'speak-09', title: 'Answer when you do not know', context: '问答中有人要求现有材料没有支持的结论。',
    prompt: 'You tested a shorter weekly meeting in one small team. Someone asks whether it will work equally well for every department. Respond without bluffing, shrinking into vague disclaimers, or abandoning the useful result. Give the boundary and a practical way to learn more.', seconds: 90,
    scaffold: ['先直接回应不能普遍确认。', '说清现有试验是什么样，不扩展到没有比较的情形。', '给出可验证的下一步或需要的信息。'],
    model: `I can't tell you that from the trial we ran. We tested one small team doing routine updates, so I wouldn't assume the same format works for departments with a lot of unresolved decisions. What we did see was less repetition without people losing track of their next steps. That's useful, but it's a narrower result. If another department wants to try it, I'd start with a single recurring meeting and agree in advance what needs to come out of it. Then we can check whether the shorter version still produces those outcomes. If you tell me what your meetings are usually for, I can give a more useful view on whether the comparison is relevant.`,
    checklist: ['直接承认未知，没有伪装成确定答案。', '保留已知结果的价值。', '回答的限定与问题相关，不是一长串泛泛免责声明。', '提出能缩小未知范围的信息或行动。'],
  },
  {
    id: 'speak-10', title: 'Change the register, keep the meaning', context: '同一个安排分别讲给朋友和项目伙伴。',
    prompt: 'Your central message is: the draft is usable for an initial discussion, but one section still needs checking, so it should not be treated as final. Say this first to a friendly colleague, then to an external project partner. Keep the facts unchanged while adjusting the register.', seconds: 60,
    scaffold: ['友好口头版：短句、具体对象、自然保留。', '专业版：清楚说明可用范围和限制，不堆正式词。', '听两遍自己的录音：语气变了，承诺有没有无意扩大？'],
    model: `Friendly colleague: The draft's good enough to get the conversation started. I just need to double-check the comparison section, so let's not send it around as the final version yet. If you spot anything that feels off, tell me before I do the next pass.

External partner: The current draft is ready for an initial discussion. The comparison section is still being checked, so please treat the figures in that section as provisional. We'd welcome comments on the overall direction at this stage, and we'll circulate a confirmed version once that review is complete.`,
    checklist: ['两版都保留“可讨论、未最终确认”的核心区别。', '专业版仍然直接易懂。', '友好版没有因随意而丢掉重要限定。', '通过语块和语气调整，而非只替换成更长的词。'],
  },
  {
    id: 'speak-11', title: 'Synthesize without flattening the disagreement', context: '总结两个方案，为下一轮讨论找到具体分歧。',
    prompt: 'One group wants every event session recorded so absent members can watch later. Another worries that recording will make informal discussion less candid. Summarise both positions fairly, name the real trade-off, and propose a limited experiment. Do not pretend the concerns are identical.', seconds: 120,
    scaffold: ['分别说出双方希望保护的价值。', '明确冲突点，不把“都很重要”当结论。', '提出保留关键价值的小试验和检查问题。'],
    model: `Both groups want people to get more from the event, but they're protecting different things. The first group is focused on access: if you can't attend, a recording lets you catch up. The second is worried about what changes when people know every unfinished thought will be available afterwards. That concern isn't necessarily an objection to sharing knowledge; it may be an objection to recording exploratory conversation. We could separate the formats. Record the prepared presentations, then offer an unrecorded discussion with a short, agreed summary afterwards. I'd try that for one event rather than make it permanent immediately. We'd want to ask absent members whether the recording and summary were useful, and ask participants whether the discussion still felt open. If the summary leaves too much out, we can adjust it without assuming that recording everything is the only solution.`,
    checklist: ['没有把任何一方描绘成懒惰、固执或不愿分享。', '明确说出开放讨论与后续可访问性之间的取舍。', '提出试验而非武断地宣称双方已被完全满足。', '检查问题能覆盖两边各自关心的结果。'],
  },
  {
    id: 'speak-12', title: 'Decline without leaving a false maybe', context: '友好拒绝一个当前无暇接受的邀请。',
    prompt: 'A neighbour invites you to help organise a regular weekend group. You like the idea but cannot take on an ongoing role. Decline the role clearly, preserve goodwill, and offer one limited contribution only if you could genuinely deliver it.', seconds: 60,
    scaffold: ['把认可活动与接受责任分开。', '说清不能承担的是持续角色，而不是否定对方。', '如有替代贡献，说明范围；没有就不编造。'],
    model: `It sounds like a lovely idea, and I'm glad you're getting it started. I can't take on a regular organising role at the moment, though. My weekends are too unpredictable, and I wouldn't want you depending on me and then having to cover for me. What I could do is read through the first invitation and give you a few comments this week. After that, I'd be happier joining as an occasional participant when I can. I know that's a smaller offer than you were hoping for, so please plan the organising team without me.`,
    checklist: ['拒绝足够清楚，不让对方等待一个实际不会发生的答应。', '保持友好，但没有反复自责。', '有限贡献不会被误解成长期承诺。', '没有用不真实的借口换取短期轻松。'],
  },
];

export const resources = [
  {
    id: 'resource-cefr', title: 'Council of Europe · CEFR Companion Volume',
    url: 'https://rm.coe.int/common-european-framework-of-reference-for-languages-learning-teaching/16809ea0d4',
    kind: '能力描述 · 官方参考', level: 'C1 / C2 参考，不用于自动定级',
    howToUse: '阅读印刷页37、38–41、133–134：选择与你场景相关的清晰度、灵活表达、互动和韵律目标。不要把 C2 等同于母语者，也不要把描述表当成已经完成的测评。',
  },
  {
    id: 'resource-bc-c1', title: 'British Council · C1 listening',
    url: 'https://learnenglish.britishcouncil.org/free-resources/listening/c1',
    kind: '教学音频 · 理解练习', level: '出版方标注 C1',
    howToUse: '每次选一课：先不看文本完成理解题，再找出漏听的连读、指代或隐含态度，最后口头概括。教学录音的可控性不能代替自然交谈中的难度。',
  },
  {
    id: 'resource-bc-audio', title: 'British Council · Audio zone',
    url: 'https://learnenglish.britishcouncil.org/free-resources/general/audio-zone',
    kind: '真人自然讲话 · 多种口音 · 文本', level: '出版方标注 B2–C1',
    howToUse: '选一个不熟悉的话题，先听60–90秒并记主旨，再查文本定位实际没有听出的词块。每次再用自己的话复述，不把理解自然讲话等同于模仿单一口音。',
  },
  {
    id: 'resource-bc-restaurant', title: 'British Council · A special restaurant',
    url: 'https://learnenglish.britishcouncil.org/free-resources/general/audio-zone/special-restaurant',
    kind: '真人访谈 · 自发叙事 · 文本', level: 'Audio zone；非标准化测验',
    howToUse: '先听一个完整叙事段落，注意停顿、自我修正和听者的短回应。核对文本后，用三个要点重讲这段经历，保留讲者态度而不逐字复制。',
  },
  {
    id: 'resource-ted-listening', title: 'TED · Julian Treasure: 5 ways to listen better',
    url: 'https://www.ted.com/talks/julian_treasure_5_ways_to_listen_better',
    kind: '真人准备式演讲 · 文本入口', level: '原生内容；未按 CEFR 分级',
    howToUse: '先关字幕听一小段，写出观点与支撑例子，再打开 Read transcript 核对。可模仿一段意群与重音，但这类精心准备的演讲不代表随意多人对话。',
  },
  {
    id: 'resource-ted-conversation', title: 'TED · How to talk so people will listen',
    url: 'https://www.ted.com/podcasts/julian-treasure-transcript',
    kind: '真人播客访谈 · 完整文本 · 播放链接', level: '原生内容；未按 CEFR 分级',
    howToUse: '从页面 Listen along 进入原站播放。选一问一答，观察追问、接话和说法修正；关掉文本后概括来宾真正回答了什么、又没有回答什么。',
  },
];

export const benchmarks = [
  {
    id: 'benchmark-01', title: 'Make a complex idea usable', seconds: 90,
    prompt: 'Explain to a non-specialist why people who choose a new service may differ from people who keep the old one. Use a fictional booking-form example. State one conclusion the comparison supports, one it does not, and one practical next step. Record without a written script.',
    checklist: ['前15秒是否已让听众知道问题是什么？', '是否用普通词解释关键区别？', '是否保留了重要限定？', '收尾是否给出一个对应问题的下一步？'],
  },
  {
    id: 'benchmark-02', title: 'Disagree and leave room', seconds: 60,
    prompt: 'A colleague says, “Let’s remove every recurring meeting next week.” You support fewer unnecessary meetings but disagree with doing it all at once. Respond, offer a limited alternative, and ask one question that invites a genuine reply.',
    checklist: ['是否区分共同目标与具体异议？', '理由是否具体且不攻击对方？', '语气是否清楚，而非强硬或过度退让？', '最后的问题是否可能改变你的方案？'],
  },
  {
    id: 'benchmark-03', title: 'Tell a compact story', seconds: 90,
    prompt: 'Tell the same real or clearly fictional story about a small misunderstanding that ended well. Include the setup, the moment you realised the problem, and why the ending mattered. Do not memorise a script between recordings.',
    checklist: ['听众是否能跟上人物与时间关系？', '关键转折是否突出？', '有无不必要的背景拖延？', '录音中的停顿与重音是否帮助听众理解？'],
  },
  {
    id: 'benchmark-04', title: 'Represent both sides fairly', seconds: 120,
    prompt: 'One group wants every event discussion recorded for absent members. Another worries that recording will reduce candour. Summarise both concerns, identify the actual trade-off, and propose a small experiment with a way to evaluate it.',
    checklist: ['两方的理由是否都被准确表达？', '是否保留冲突，而非空泛说“双方都对”？', '试验是否比原来的二选一更具体？', '检查标准是否同时顾及两边的需求？'],
  },
  {
    id: 'benchmark-05', title: 'Repair an ambiguous commitment', seconds: 60,
    prompt: 'You offered to “take a look” at a document. The other person now expects a complete rewrite. Clarify what you meant, take responsibility for ambiguous wording, say exactly what you can provide, and check the revised agreement.',
    checklist: ['误解是否在前半段就被澄清？', '是否承认措辞责任但没有增加不愿承担的承诺？', '帮助的范围与时间是否可执行？', '结束时双方还可能在哪一点理解不同？'],
  },
  {
    id: 'benchmark-06', title: 'Shift register without shifting the facts', seconds: 90,
    prompt: 'Deliver the same message twice: the draft is suitable for an initial discussion, but one section is still being checked and is not final. First speak to a friendly colleague, then to an external partner. Keep the facts and degree of certainty identical.',
    checklist: ['两版的事实、边界和承诺是否相同？', '口头友好版是否自然但不含糊？', '专业版是否清楚而非生硬？', '是否能用语气、节奏与措辞调整正式程度？'],
  },
];
