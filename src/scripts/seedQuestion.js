import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import Question from "../models/question.model.js";

dotenv.config();
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const questions = [
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-E1",
    "questionStem": "I’m open to changing how I work when priorities or information change.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What makes it difficult to adjust how you work when priorities or information change?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 1
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-E2",
    "questionStem": "I can learn new skills or processes quickly enough to keep up with change.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What makes it harder to learn new skills or processes quickly when changes occur?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 2
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-E3",
    "questionStem": "Even when change is uncomfortable, I stay solution-focused and resilient.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What aspects of change make it harder to stay solution-focused or resilient?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 3
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionCode": "PP-MA-EB1",
    "questionStem": "In the past 30 days, how often did you try a new approach to improve your work?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "is there anything getting in your way?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 4
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionCode": "PP-MA-EB2",
    "questionStem": "In the past 30 days, how often did change or uncertainty reduce your confidence or motivation?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "How did it reduce your confidence and motivation?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 5
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Forced-Choice",
    "questionCode": "PP-MA-EFC1",
    "questionStem": "Which statement fits your experience with change?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "I understand what to do and feel supported to adapt.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "I’m unsure what to do and feel left to figure it out on my own.",
        "insightPrompt": "What are the pros and cons and is this working for you?"
      },
      "higherValueOption": "B"
    },
    "order": 6
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Forced-Choice",
    "questionCode": "PP-MA-EFC2",
    "questionStem": "Which statement fits your mindset about change?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "I see change as an opportunity to improve.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "I see change as disruptive and mostly negative.",
        "insightPrompt": "What is it about change that makes you take that stance?"
      },
      "higherValueOption": "B"
    },
    "order": 7
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-E4",
    "questionStem": "I can answer honestly about my comfort with change and learning.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What makes it difficult to be open about your comfort level with change or learning?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 8
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-E5",
    "questionStem": "I am happy with the pace of change in my workplace and supports in place to support me in the transitions.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What makes the pace of change feel difficult to manage or unsupported?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 9
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-E1",
    "questionStem": "I feel safe speaking up with questions, concerns, or sharing mistakes at work.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What experiences make it harder to speak up with questions, concerns, or mistakes?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 10
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-E2",
    "questionStem": "When I raise an issue, it is handled respectfully and fairly.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What makes it difficult to feel that issues are handled respectfully or fairly?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 11
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-E3",
    "questionStem": "I have the support I need to protect my wellbeing and manage stress at work.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What support would help you better manage stress or protect your wellbeing at work?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 12
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionCode": "PP-PHS-EB1",
    "questionStem": "In the past 30 days, how often did you speak up about a concern or risk?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What may have made it harder to speak up about a concern or risk?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 13
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionCode": "PP-PHS-EB2",
    "questionStem": "In the past 30 days, how often did you feel overwhelmed or at risk of burnout?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What factors most contributed to feeling overwhelmed or at risk of burnout?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 14
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Forced-Choice",
    "questionCode": "PP-PHS-EFC1",
    "questionStem": "Which statement is closer to your experience when workload is high?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "We discuss priorities and adjust expectations.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "I’m expected to cope without changes or support.",
        "insightPrompt": "What are the impacts and what could be different if you had more support?"
      },
      "higherValueOption": "B"
    },
    "order": 15
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-E4",
    "questionStem": "I feel safe answering this assessment honestly without fear of consequences.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What concerns might make it harder to answer assessments or feedback honestly?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 16
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-E1",
    "questionStem": "People on my team communicate openly and listen to understand.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What gets in the way of open communication or listening within your team?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 17
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-E2",
    "questionStem": "I can raise concerns directly with colleagues without conflict escalating.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What makes it difficult to raise concerns directly without conflict escalating?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 18
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-E3",
    "questionStem": "I feel trusted and included by the people I work with.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What situations make it harder to feel trusted or included on your team?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 19
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-EB1",
    "questionStem": "In the past 30 days, how often did you receive clear, helpful communication from your team?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "How would you describe the communication from your team?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 20
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-EB2",
    "questionStem": "In the past 30 days, how often were disagreements handled respectfully and constructively?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "In your opinion how could disagreements be handled better?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 21
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-EFC1",
    "questionStem": "Which statement is closer to your team’s reality?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "We address tensions early and resolve issues respectfully.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Tensions linger and problems are avoided or handled indirectly.",
        "insightPrompt": "What are the impacts of avoided or unaddressed problems?"
      },
      "higherValueOption": "B"
    },
    "order": 22
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-EFC2",
    "questionStem": "Which statement is closer to your feedback experience?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Feedback helps me improve and is delivered respectfully.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Feedback feels unclear, harsh, or is rarely given.",
        "insightPrompt": "What are your preferred methods and frequency of receiving feedback?"
      },
      "higherValueOption": "B"
    },
    "order": 23
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-E4",
    "questionStem": "I can be candid about team dynamics and relationships without worry.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What makes it difficult to speak candidly about team dynamics or relationships?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 24
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-E5",
    "questionStem": "My manager/leader shows genuine care for people, not just results.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What actions or behaviours make it difficult to feel that people are valued as much as results?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 25
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-E6",
    "questionStem": "My manager/leader is approachable and responds constructively when concerns are raised.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What makes it harder to approach your manager or raise concerns constructively?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 26
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-E7",
    "questionStem": "I receive recognition and support that helps me stay engaged and motivated to perform well.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What kind of recognition or support feels missing in your role?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 27
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-EB3",
    "questionStem": "In the past 30 days, how often did your manager/leader check in on workload or wellbeing?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Do you feel like your manager or supervisor has a strong insight into your work and well-being?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 28
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-EB4",
    "questionStem": "In the past 30 days, how often did you receive coaching, guidance, or feedback that helped you improve?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What could change if you had more regular feedback and coaching?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 29
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-EFC3",
    "questionStem": "Which statement best matches your experience with leadership support?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "My leader helps remove barriers so I can do my job well.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Barriers remain and I’m expected to manage them on my own.",
        "insightPrompt": "How do these barriers impact your work and what would be different if you had more support?"
      },
      "higherValueOption": "B"
    },
    "order": 30
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-EFC4",
    "questionStem": "Which statement best matches your experience of recognition and respect?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Effort and contributions are noticed and acknowledged.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Effort and contributions often go unnoticed.",
        "insightPrompt": "How do you like to be recongnized?"
      },
      "higherValueOption": "B"
    },
    "order": 31
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-E8",
    "questionStem": "I can be honest about leadership support without worry.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What concerns make it difficult to speak honestly about leadership support?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 32
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Self-Rating",
    "questionCode": "OS-P-E1",
    "questionStem": "I understand the top priorities for my team.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What makes it difficult to clearly understand your team’s current priorities?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 33
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Self-Rating",
    "questionCode": "OS-P-E2",
    "questionStem": "I understand how my work connects to broader organizational goals.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What makes it harder to see how your work contributes to broader organizational goals?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 34
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Behavioural",
    "questionCode": "OS-P-EB1",
    "questionStem": "In the past 30 days, how often did shifting priorities disrupt your work?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What is causing shifting priorities to disrupt your work?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 35
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Behavioural",
    "questionCode": "OS-P-EB2",
    "questionStem": "In the past 30 days, how often were priorities clearly reinforced by your manager?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What are the impacts on your work when priorities change?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 36
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Forced-Choice",
    "questionCode": "OS-P-EFC1",
    "questionStem": "Which statement best reflects your experience of priorities?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Priorities are clear and manageable.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Priorities change frequently and feel overwhelming.",
        "insightPrompt": "What are the impacts of constantly changing priorities and what do you think would make that more manageable."
      },
      "higherValueOption": "B"
    },
    "order": 37
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Forced-Choice",
    "questionCode": "OS-P-EFC2",
    "questionStem": "Which statement best reflects workload expectations?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Work expectations match available time.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Work expectations often exceed capacity.",
        "insightPrompt": "What happens when work expectations exceed capacity?  How do you manage?"
      },
      "higherValueOption": "B"
    },
    "order": 38
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Self-Rating",
    "questionCode": "OS-WC-E1",
    "questionStem": "I understand my responsibilities and decision boundaries.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do responsibilities or decision boundaries feel unclear in your role?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 39
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Self-Rating",
    "questionCode": "OS-WC-E2",
    "questionStem": "Handoffs between team members are clear and efficient.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do handoffs between team members most often break down or cause delays?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 40
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Behavioural",
    "questionCode": "OS-WC-EB1",
    "questionStem": "In the past 30 days, how often did unclear instructions cause rework?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are unclear instructions creating avoidable rework?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 41
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Behavioural",
    "questionCode": "OS-WC-EB2",
    "questionStem": "In the past 30 days, how often did you need clarification before completing tasks?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What information is most often missing when you begin a task?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 42
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Forced-Choice",
    "questionCode": "OS-WC-EFC1",
    "questionStem": "Which statement best reflects operational flow?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Work processes are clear and predictable.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Processes frequently require clarification.",
        "insightPrompt": "Do you believe you receive enough clarifcation before change happens or does it seem sudden thus requiring more explanation?"
      },
      "higherValueOption": "B"
    },
    "order": 43
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Forced-Choice",
    "questionCode": "OS-WC-EFC2",
    "questionStem": "Which statement best reflects communication clarity?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Expectations are clearly communicated.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Expectations are often unclear or assumed.",
        "insightPrompt": "Why do you believe that is?"
      },
      "higherValueOption": "B"
    },
    "order": 44
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Self-Rating",
    "questionCode": "OS-ERM-E1",
    "questionStem": "I have the tools and resources needed to do my job effectively.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What tools or resources feel missing or insufficient to do your job effectively?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 45
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Self-Rating",
    "questionCode": "OS-ERM-E2",
    "questionStem": "My workload feels sustainable over time.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What factors are making your workload feel unsustainable?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 46
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Behavioural",
    "questionCode": "OS-ERM-EB1",
    "questionStem": "In the past 30 days, how often did workload exceed your capacity?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What has most often caused workload to exceed your capacity?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 47
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Behavioural",
    "questionCode": "OS-ERM-EB2",
    "questionStem": "In the past 30 days, how often did resource gaps delay your work?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Despite delays what else were the impacts of resource gaps?  Please give examples.",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 48
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Forced-Choice",
    "questionCode": "OS-ERM-EFC1",
    "questionStem": "Which statement best reflects resource support?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "I receive timely support when issues arise.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Support is slow or difficult to access.",
        "insightPrompt": "Can you give examples and impacts of slow or no support?"
      },
      "higherValueOption": "B"
    },
    "order": 49
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Forced-Choice",
    "questionCode": "OS-ERM-EFC2",
    "questionStem": "Which statement best reflects workload management?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Work is adjusted when capacity is strained.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Work continues regardless of strain.",
        "insightPrompt": "Can you give examples and impacts of workplace strain?"
      },
      "higherValueOption": "B"
    },
    "order": 50
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-DAAR-E1",
    "questionStem": "I have access to the data I need to do my job well.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What data do you need but struggle to access when doing your work?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 51
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-DAAR-E2",
    "questionStem": "Data available to me is accurate and reliable.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What issues make the data you use feel inaccurate, incomplete, or unreliable?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 52
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Behavioural",
    "questionCode": "DF-DAAR-EB1",
    "questionStem": "In the past 30 days, how often did you use data to improve your work?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What prevents you from using data more often to guide or improve your work?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 53
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DAAR-EFC1",
    "questionStem": "Which statement best reflects data usage?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Data helps me make informed decisions.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "I rely mostly on experience or guesswork.",
        "insightPrompt": "What makes reliable data or information difficult to access when you need it?"
      },
      "higherValueOption": "B"
    },
    "order": 54
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DAAR-EFC2",
    "questionStem": "Which statement best reflects automation support?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Tools reduce manual effort where possible.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Much work is still manual and repetitive.",
        "insightPrompt": "Which tasks feel unnecessarily manual or repetitive in your daily work?"
      },
      "higherValueOption": "B"
    },
    "order": 55
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Self-Rating",
    "questionCode": "DF-DCC-E1",
    "questionStem": "Digital platforms make collaboration easier.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do digital platforms fall short when your team tries to collaborate?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 56
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Self-Rating",
    "questionCode": "DF-DCC-E2",
    "questionStem": "Information is easy to find in shared systems.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What makes it difficult to find the information you need in shared systems?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 57
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Behavioural",
    "questionCode": "DF-DCC-EB1",
    "questionStem": "In the past 30 days, how often did digital tools reduce confusion?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where do digital tools still create confusion instead of clarifying work?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 58
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DCC-EFC1",
    "questionStem": "Which statement best reflects collaboration tools?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Shared tools improve coordination.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Coordination depends mostly on email or chats.",
        "insightPrompt": "What systems or tools are missing that would make coordination easier than relying on email or chat?"
      },
      "higherValueOption": "B"
    },
    "order": 59
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DCC-EFC2",
    "questionStem": "Which statement best reflects communication clarity?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Updates are transparent and accessible.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Information is scattered or siloed.",
        "insightPrompt": "Where do you most often struggle to find the information you need?"
      },
      "higherValueOption": "B"
    },
    "order": 60
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-MCCR-E1",
    "questionStem": "I feel confident using new digital tools.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What makes it harder to feel confident when using new digital tools?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 61
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-MCCR-E2",
    "questionStem": "I feel supported when learning new systems.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What support is missing when you need to learn a new system?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 62
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Behavioural",
    "questionCode": "DF-MCCR-EB1",
    "questionStem": "In the past 30 days, how often did you try a new digital feature or tool?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What makes it difficult to experiment with new digital features or tools?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 63
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-MCCR-EFC1",
    "questionStem": "Which statement best reflects your mindset toward digital change?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "I am open and willing to adapt.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "I prefer sticking with familiar methods.",
        "insightPrompt": "What concerns or barriers make it harder to try new tools or digital approaches?"
      },
      "higherValueOption": "B"
    },
    "order": 64
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-MCCR-EFC2",
    "questionStem": "Which statement best reflects learning support?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Training and help are available when needed.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Support is limited or inconsistent.",
        "insightPrompt": "What kind of support would make it easier to resolve system or technology issues?"
      },
      "higherValueOption": "B"
    },
    "order": 65
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Self-Rating",
    "questionCode": "DF-TSP-E1",
    "questionStem": "I know how to use core systems effectively.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What gaps in training or experience make core systems harder to use effectively?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 66
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Self-Rating",
    "questionCode": "DF-TSP-E2",
    "questionStem": "Systems are intuitive and easy to navigate.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What parts of the systems you use are confusing or difficult to navigate?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 67
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Behavioural",
    "questionCode": "DF-TSP-EB1",
    "questionStem": "In the past 30 days, how often did system issues slow your work?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Which system issues are most often slowing your work?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 68
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Forced-Choice",
    "questionCode": "DF-TSP-EFC1",
    "questionStem": "Which statement best reflects system usability?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Systems support efficient work.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Systems require frequent workarounds.",
        "insightPrompt": "Which systems most often require workarounds to get your work done?"
      },
      "higherValueOption": "B"
    },
    "order": 69
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Forced-Choice",
    "questionCode": "DF-TSP-EFC2",
    "questionStem": "Which statement best reflects training effectiveness?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Training prepares me well to use systems.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "I mostly learn systems on my own.",
        "insightPrompt": "What training or guidance would help you feel more confident using systems?"
      },
      "higherValueOption": "B"
    },
    "order": 70
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-M1",
    "questionStem": "I coach my team through change by focusing on learning, experimentation, and progress.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What might be preventing learning, experimentation, or progress from being emphasized when your team is navigating change?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 1
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-M2",
    "questionStem": "I help team members build confidence when new expectations, tools, or processes are introduced.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What may be limiting your team’s confidence when new tools, expectations, or processes are introduced?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 2
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-M3",
    "questionStem": "I model adaptability by adjusting plans and behaviours when conditions change.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What might make it difficult to adjust plans or behaviours quickly when conditions change?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 3
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionCode": "PP-MA-MB1",
    "questionStem": "In the past 30 days, how often did you provide coaching or practice opportunities to build new skills?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What is preventing you from creating more opportunities for team members to practice and build new skills?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 4
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionCode": "PP-MA-MB2",
    "questionStem": "In the past 30 days, how often did you remove barriers so the team could adopt a new way of working?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What barriers are most often slowing adoption of new ways of working on your team?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 5
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Forced-Choice",
    "questionCode": "PP-MA-MFC1",
    "questionStem": "Which best reflects how change is introduced on your team?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "With support, practice, and follow-up.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Announced and we move on without support.",
        "insightPrompt": "What support or follow‑through is missing after change is announced on your team?"
      },
      "higherValueOption": "B"
    },
    "order": 6
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Forced-Choice",
    "questionCode": "PP-MA-MFC2",
    "questionStem": "Which best reflects how setbacks are treated?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "As learning opportunities.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "As failures to avoid.",
        "insightPrompt": "What reactions to setbacks may be discouraging learning or experimentation?"
      },
      "higherValueOption": "B"
    },
    "order": 7
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-M1",
    "questionStem": "I actively create an environment where team members can speak up without fear.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What signals might your team be receiving that make it harder to speak up or challenge ideas?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 8
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-M2",
    "questionStem": "I address behaviours that undermine respect, inclusion, or psychological safety.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What situations make it difficult to address behaviours that undermine respect or psychological safety?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 9
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-M3",
    "questionStem": "I monitor workload and stress signals and intervene before burnout escalates.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What prevents early intervention when workload or stress signals begin to rise?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 10
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionCode": "PP-PHS-MB1",
    "questionStem": "In the past 30 days, how often did you adjust priorities/capacity to protect wellbeing?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Was there a reason for that?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 11
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Forced-Choice",
    "questionCode": "PP-PHS-MFC1",
    "questionStem": "Which statement best matches your typical response to concerns?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "I respond with curiosity and action.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "I respond defensively or delay addressing it.",
        "insightPrompt": "Can you tell me more about why you respond that way?"
      },
      "higherValueOption": "B"
    },
    "order": 12
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Forced-Choice",
    "questionCode": "PP-PHS-MFC2",
    "questionStem": "Which statement best matches your team’s experience with mistakes?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Mistakes are treated as learning without blame.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Mistakes often trigger blame or embarrassment.",
        "insightPrompt": "Can you give more examples or be more specific?"
      },
      "higherValueOption": "B"
    },
    "order": 13
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-M4",
    "questionStem": "People feel safe raising concerns about fairness or inclusion.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What do you think could improve this?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 14
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionCode": "PP-PHS-MB2",
    "questionStem": "In the past 30 days, how often did you address a fairness or inclusion issue directly?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Did anything get in your way and what happened as a result of action or inaction?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 15
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionCode": "PP-PHS-MB3",
    "questionStem": "In the past 30 days, how often did you ensure quieter voices were included in decisions?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Is this an ongoing challenge and what do you do to address it?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 16
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Forced-Choice",
    "questionCode": "PP-PHS-MFC3",
    "questionStem": "Which best reflects how inclusion is experienced?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "People feel they belong and can contribute fully.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Some people feel excluded or overlooked.",
        "insightPrompt": "What makes you believe this is their experience?"
      },
      "higherValueOption": "B"
    },
    "order": 17
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Calibration",
    "questionCode": "PP-PHS-MCAL1",
    "questionStem": "I feel confident in my ability to foster psychological safety and trust on my team.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What situations make it difficult to foster psychological safety or trust within your team?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 18
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-M1",
    "questionStem": "I handle conflict and difficult conversations calmly and constructively.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What makes it challenging to address conflict or difficult conversations constructively?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 19
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-M2",
    "questionStem": "I build trust by following through consistently and listening with empathy.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What factors may be preventing consistent follow-through or empathetic listening with your team?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 20
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-M3",
    "questionStem": "I encourage open dialogue and honest feedback across my team.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What might be discouraging team members from speaking openly or sharing honest feedback?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 21
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-MB1",
    "questionStem": "In the past 30 days, how often did you give timely, specific feedback that improved performance?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What makes it difficult to provide timely or specific feedback that helps improve performance?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 22
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-MB2",
    "questionStem": "In the past 30 days, how often did you resolve a tension before it affected outcomes?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What makes it difficult to address tensions early before they affect team outcomes?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 23
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-MFC1",
    "questionStem": "I ensure that team understands the “why” behind decisions.",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What makes it harder to consistently explain the reasoning behind decisions to your team?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 24
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-MFC2",
    "questionStem": "I address performance issues directly and respectfully.",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What situations make it difficult to address performance concerns directly and respectfully?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 25
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Self-Rating",
    "questionCode": "OS-P-M1",
    "questionStem": "My team understands the top priorities and how they connect to organizational goals.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What might be making it difficult for team members to see how their work connects to organizational goals?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 26
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Self-Rating",
    "questionCode": "OS-P-M2",
    "questionStem": "I make clear trade-offs when new work emerges (what we will stop, defer, or de-scope).",
    "scale": "SCALE_1_5",
    "insightPrompt": "What prevents clear trade-offs when new work is introduced?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 27
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Behavioural",
    "questionCode": "OS-P-MB1",
    "questionStem": "In the past 30 days, how often did you re-prioritize work to protect focus on the highest-impact outcomes?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What makes it difficult to re-prioritize work when higher-impact outcomes emerge?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 28
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Behavioural",
    "questionCode": "OS-P-MB2",
    "questionStem": "In the past 30 days, how often did urgent requests disrupt planned priorities for your team?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What is causing urgent requests to disrupt planned priorities so frequently?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 29
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Forced-Choice",
    "questionCode": "OS-P-MFC1",
    "questionStem": "Which statement best reflects your team’s prioritization discipline?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "We regularly review priorities and remove lower-value work.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Work accumulates and we try to do everything.",
        "insightPrompt": "What prevents the team from stopping or deferring lower‑priority work?"
      },
      "higherValueOption": "B"
    },
    "order": 30
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Forced-Choice",
    "questionCode": "OS-P-MFC2",
    "questionStem": "Which statement best reflects how priorities are communicated?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Priorities are simple, visible, and consistently reinforced.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Priorities change often or are interpreted differently across people.",
        "insightPrompt": "What causes priorities to shift or be interpreted differently across the team?"
      },
      "higherValueOption": "B"
    },
    "order": 31
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Self-Rating",
    "questionCode": "OS-WC-M1",
    "questionStem": "Roles, responsibilities, and decision ownership are clear within my team.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What decisions or tasks are unclear because roles or ownership are not well defined?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 32
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Self-Rating",
    "questionCode": "OS-WC-M2",
    "questionStem": "Workflows and handoffs with other teams are clear enough to prevent avoidable delays or rework.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do workflows or handoffs most often break down between teams?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 33
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Behavioural",
    "questionCode": "OS-WC-MB1",
    "questionStem": "In the past 30 days, how often did unclear ownership or handoffs delay delivery?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where is delivery slowing down because ownership or handoffs are unclear?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 34
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Behavioural",
    "questionCode": "OS-WC-MB2",
    "questionStem": "In the past 30 days, how often did decisions get stuck waiting for approvals or escalation?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What decisions most often get delayed waiting for approvals or escalation?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 35
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Forced-Choice",
    "questionCode": "OS-WC-MFC1",
    "questionStem": "Which statement best reflects day-to-day operational flow?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Work moves smoothly with predictable handoffs and clear accountability.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Work often stalls due to unclear ownership, approvals, or rework.",
        "insightPrompt": "Where do tasks most often stall because ownership, approvals, or expectations are unclear?"
      },
      "higherValueOption": "B"
    },
    "order": 36
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Forced-Choice",
    "questionCode": "OS-WC-MFC2",
    "questionStem": "Which statement best reflects decision-making on your work?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Decision rights are clear and teams can act without unnecessary escalation.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Decisions are unclear and frequently require escalation to move forward.",
        "insightPrompt": "What types of decisions most often require escalation because ownership or decision authority is unclear?"
      },
      "higherValueOption": "B"
    },
    "order": 37
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Self-Rating",
    "questionCode": "OS-ERM-M1",
    "questionStem": "My team has sufficient capacity (time/people) to meet current expectations without sustained overload.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What factors are most often causing your team’s workload to exceed available capacity?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 38
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Self-Rating",
    "questionCode": "OS-ERM-M2",
    "questionStem": "I plan and allocate resources proactively to match peaks in demand and key deliverables.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What makes it difficult to anticipate demand and adjust resources before pressure builds?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 39
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Behavioural",
    "questionCode": "OS-ERM-MB1",
    "questionStem": "In the past 30 days, how often did capacity constraints require you to delay, de-scope, or re-sequence commitments?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What situations most often create capacity constraints that force you to delay or adjust commitments?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 40
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Behavioural",
    "questionCode": "OS-ERM-MB2",
    "questionStem": "In the past 30 days, how often did you escalate resource gaps (skills/tools/budget) before they impacted outcomes?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What makes it difficult to escalate resource gaps early enough to prevent impact on outcomes?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 41
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Forced-Choice",
    "questionCode": "OS-ERM-MFC1",
    "questionStem": "Which statement best reflects how your team manages capacity?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "We regularly assess capacity and adjust commitments before issues escalate.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "We absorb extra work until stress or quality issues force changes.",
        "insightPrompt": "What prevents workload or priorities from being adjusted before stress or quality issues escalate?"
      },
      "higherValueOption": "B"
    },
    "order": 42
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Forced-Choice",
    "questionCode": "OS-ERM-MFC2",
    "questionStem": "Which statement best reflects resource allocation decisions?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Resources are aligned to priorities and shifted when needed.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Resources are fixed, and priorities compete without reallocation.",
        "insightPrompt": "What makes it difficult to reallocate resources when priorities shift?"
      },
      "higherValueOption": "B"
    },
    "order": 43
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-DAAR-M1",
    "questionStem": "I use relevant data/metrics to guide team decisions and performance discussions.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What might be preventing data or metrics from consistently informing team decisions?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 44
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-DAAR-M2",
    "questionStem": "Our team has access to reliable data (timely, accurate, trusted) to do our work effectively.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What is making it difficult for your team to access reliable or trusted data?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 45
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Behavioural",
    "questionCode": "DF-DAAR-MB1",
    "questionStem": "In the past 30 days, how often did you use data to challenge assumptions or adjust a decision?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What makes it difficult to use data to challenge assumptions or refine decisions?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 46
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DAAR-MFC1",
    "questionStem": "Which statement best reflects how data is used in your area?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Data is accessible and influences decisions and priorities.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Data is hard to access, inconsistent, or rarely used in decisions.",
        "insightPrompt": "What is making reliable data difficult to access or use in everyday decisions?"
      },
      "higherValueOption": "B"
    },
    "order": 47
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DAAR-MFC2",
    "questionStem": "Which statement best reflects automation/AI readiness?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "We have identified repeatable work that could be automated and are testing improvements.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Automation/AI is discussed, but we haven’t translated it into practical pilots.",
        "insightPrompt": "What is preventing automation or AI ideas from becoming small practical pilots?"
      },
      "higherValueOption": "B"
    },
    "order": 48
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Self-Rating",
    "questionCode": "DF-DCC-M1",
    "questionStem": "Our team uses digital collaboration tools to share work status, decisions, and documentation transparently.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What may be limiting consistent use of digital collaboration tools for sharing work and decisions?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 49
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Self-Rating",
    "questionCode": "DF-DCC-M2",
    "questionStem": "Cross-team collaboration is effective because information is easy to find and up to date.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where does information become difficult to find or outdated when collaborating across teams?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 50
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Behavioural",
    "questionCode": "DF-DCC-MB1",
    "questionStem": "In the past 30 days, how often did digital tools reduce the need for meetings or follow-up emails?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What prevents digital tools from reducing meetings or follow-up coordination?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 51
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DCC-MFC1",
    "questionStem": "Which statement best reflects communication efficiency?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Information is centralized and easy to locate; updates are visible to those who need them.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Information is scattered across emails/chats/files; people often ask for the latest version.",
        "insightPrompt": "What is preventing a clear single source of truth for team information?"
      },
      "higherValueOption": "B"
    },
    "order": 52
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DCC-MFC2",
    "questionStem": "Which statement best reflects cross-team coordination?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Shared tools and practices make coordination smooth and predictable.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Coordination relies on manual follow-ups and individual effort.",
        "insightPrompt": "What systems or processes are missing that would reduce manual follow-ups?"
      },
      "higherValueOption": "B"
    },
    "order": 53
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-MCCR-M1",
    "questionStem": "I feel confident leading digital change within my team (new tools, processes, or ways of working).",
    "scale": "SCALE_1_5",
    "insightPrompt": "What makes it difficult to confidently lead digital changes within your team?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 54
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-MCCR-M2",
    "questionStem": "My team generally approaches new digital ways of working with openness rather than resistance.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What concerns or barriers may be causing hesitation or resistance toward new digital ways of working?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 55
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Behavioural",
    "questionCode": "DF-MCCR-MB1",
    "questionStem": "In the past 30 days, how often did you visibly champion or model adoption of a new digital practice?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What factors made it difficult to visibly champion or model adoption of a new digital practice with your team?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 56
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-MCCR-MFC1",
    "questionStem": "Which statement best reflects your team’s approach to digital change?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "We experiment, learn quickly, and improve as we go.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "We delay adoption until solutions feel fully proven and low-risk.",
        "insightPrompt": "What concerns or risks make it difficult to try new tools or approaches before they are fully proven?"
      },
      "higherValueOption": "B"
    },
    "order": 57
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-MCCR-MFC2",
    "questionStem": "Which statement best reflects the support environment for change?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "People have time, guidance, and reinforcement to build confidence with new tools.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "People are expected to adapt quickly with limited time or support.",
        "insightPrompt": "What support or time would help people adapt more effectively to new tools or ways of working?"
      },
      "higherValueOption": "B"
    },
    "order": 58
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Self-Rating",
    "questionCode": "DF-TSP-M1",
    "questionStem": "My team understands how to use core tools/systems effectively to complete work with minimal friction.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What gaps in knowledge, training, or system design make it difficult for your team to use core tools effectively?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 59
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Self-Rating",
    "questionCode": "DF-TSP-M2",
    "questionStem": "Our tools and systems are integrated enough to avoid frequent manual workarounds or duplicate entry.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do systems fail to integrate smoothly, causing duplicate work or manual workarounds?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 60
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Behavioural",
    "questionCode": "DF-TSP-MB1",
    "questionStem": "In the past 30 days, how often did tool/system limitations require manual workarounds or rework?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Which system or tool limitations most often create the need for manual workarounds or rework?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 61
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Forced-Choice",
    "questionCode": "DF-TSP-MFC1",
    "questionStem": "Which statement best reflects system usability?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Core systems are intuitive and support efficient work.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Core systems are confusing or slow, so people avoid them when possible.",
        "insightPrompt": "What aspects of core systems make them confusing, slow, or difficult to use?"
      },
      "higherValueOption": "B"
    },
    "order": 62
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Forced-Choice",
    "questionCode": "DF-TSP-MFC2",
    "questionStem": "Which statement best reflects capability building?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "We have effective onboarding/training and quick support when issues arise.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Training/support is inconsistent; people mostly learn by trial and error.",
        "insightPrompt": "What type of training or support would make it easier for people to learn and use systems confidently?"
      },
      "higherValueOption": "B"
    },
    "order": 63
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-L1",
    "questionStem": "I model behaviours that make it safe to raise risks, concerns, and mistakes.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What behaviours might be discouraging people from raising risks or mistakes?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 1
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-L2",
    "questionStem": "I hold others accountable for behaviours that undermine respect, inclusion, or safety.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What gets in the way of addressing behaviours that undermine respect, inclusion, or safety when they occur?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 2
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-L3",
    "questionStem": "Psychological safety and wellbeing are embedded in leadership expectations and performance.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is psychological safety being treated as optional rather than as part of leadership performance?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 3
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-L4",
    "questionStem": "We allocate time/resources to reduce workload pressure and burnout risk.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What is preventing leaders from adjusting workload, capacity, or support before burnout risk escalates?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 4
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionCode": "PP-PHS-LB1",
    "questionStem": "In the past 30 days, how often did you address a behaviour/practice that reduced psychological safety?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What made it difficult to intervene when a behaviour or practice reduced psychological safety?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 5
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionCode": "PP-PHS-LB2",
    "questionStem": "In the past 30 days, how often did you sponsor actions to reduce workload/stress hotspots?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What is preventing you from acting earlier when workload or stress hotspots become visible?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 6
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionCode": "PP-PHS-LB3",
    "questionStem": "In the past 30 days, how often did you seek unfiltered feedback from frontline teams?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What may be limiting your access to candid, unfiltered feedback from frontline teams?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 7
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-L1",
    "questionStem": "We invest in the skills and learning required for our future strategy (not just today’s needs).",
    "scale": "SCALE_1_5",
    "insightPrompt": "Which future-critical capabilities are not being developed enough today, and why?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 8
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-L2",
    "questionStem": "We adapt strategy and priorities quickly when conditions change.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What slows the organization’s ability to adjust priorities when conditions change?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 9
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-L3",
    "questionStem": "We remove barriers so teams can experiment, learn, and improve ways of working.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Which barriers are leaders tolerating that make experimentation and learning harder than they should be?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 10
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-L4",
    "questionStem": "We reinforce change with follow-through practice, measurement, recognition.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is change losing momentum after launch because reinforcement is weak or inconsistent?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 11
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionCode": "PP-MA-LB1",
    "questionStem": "In the past 30 days, how often did you remove a structural barrier slowing learning/adoption?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What structural barriers are hardest to remove, and why are they persisting?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 12
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionCode": "PP-MA-LB2",
    "questionStem": "In the past 30 days, how often did you re-prioritize to focus on highest-value outcomes?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What is preventing you from making clearer trade-offs when new demands arise?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 13
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionCode": "PP-MA-LB3",
    "questionStem": "In the past 30 days, how often did you sponsor capability-building (training/coaching)?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What is limiting your ability to prioritize training or coaching where it is most needed?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 14
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Calibration",
    "questionCode": "PP-MA-LCAL1",
    "questionStem": "I feel confident that our teams have the skills required to support our future direction.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What truths about the organization’s ability to learn new skills and adapt may be difficult?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 15
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-L1",
    "questionStem": "We build trust through consistent leadership behaviour and follow-through.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where might inconsistent follow-through be weakening trust in leadership?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 16
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-L2",
    "questionStem": "Cross-team collaboration is expected and actively enabled by leaders and managers.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What leadership habits or structures are getting in the way of stronger cross-team collaboration?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 17
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-L3",
    "questionStem": "We address politics, misalignment, and conflict quickly and constructively.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What causes politics, misalignment, or conflict to linger instead of being resolved quickly?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 18
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-L4",
    "questionStem": "People feel recognized and connected to purpose, not just tasks.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Why might people be experiencing work as tasks to complete rather than purpose to contribute to?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 19
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-LB1",
    "questionStem": "In the past 30 days, how often did you intervene to remove cross-team friction?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What keeps cross-team friction from being addressed before it slows execution?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 20
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-LB2",
    "questionStem": "In the past 30 days, how often did you recognize behaviours that strengthen collaboration and trust?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What may be limiting visible recognition of the behaviours that build trust and collaboration?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 21
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-LB3",
    "questionStem": "In the past 30 days, how often did you address misalignment between leaders/teams?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What is making it harder to surface and correct misalignment between leaders or teams?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 22
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-LFC1",
    "questionStem": "Which statement about collaboration seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Collaboration is the norm and supported by leadership.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Collaboration is difficult due to silos/politics/unclear expectations.",
        "insightPrompt": "What is most often breaking down collaboration here—silos, political dynamics, or unclear expectations?"
      },
      "higherValueOption": "B"
    },
    "order": 23
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-LFC2",
    "questionStem": "Which statement about working execution seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "People feel valued and connected to the mission.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "People feel like execution matters more than people.",
        "insightPrompt": "What leadership behaviours or decisions may be signalling that execution is valued more than people?"
      },
      "higherValueOption": "B"
    },
    "order": 24
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-L5",
    "questionStem": "Leadership communication is clear, consistent, and aligned across leaders.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are teams receiving mixed signals because leadership communication is not fully aligned?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 25
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-L6",
    "questionStem": "We consistently explain \"why\" strategic initiatives matter and the impacts to the team.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What is preventing leaders from clearly explaining the rationale and team impact behind decisions?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 26
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-L7",
    "questionStem": "Leaders are visible and accessible enough to maintain trust and reduce uncertainty.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What may be making leaders feel too distant or inaccessible during times of uncertainty?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 27
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-L8",
    "questionStem": "Communication is delivered with empathy and acknowledges real constraints on teams.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where might leadership communication be overlooking the real pressures or constraints teams are facing?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 28
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-LB4",
    "questionStem": "In the past 30 days, how often did you communicate a decision with clear rationale and impacts?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What gets in the way of consistently communicating decisions with enough clarity, context, and impact?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 29
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-LB5",
    "questionStem": "In the past 30 days, how often did you engage directly with frontline teams to listen/respond?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What may be reducing direct connection between leaders and frontline teams?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 30
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-LB6",
    "questionStem": "In the past 30 days, how often did you correct mixed messages or misalignment between leaders?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Why are mixed messages between leaders not being corrected sooner?",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "order": 31
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-LFC3",
    "questionStem": "Which statement about leadership communication seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "People experience leadership communication as consistent and credible.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "People experience leadership communication as mixed or conflicting.",
        "insightPrompt": "Where are mixed or conflicting messages most often being created across leaders?"
      },
      "higherValueOption": "B"
    },
    "order": 32
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-LFC4",
    "questionStem": "Which statement about leadership listening and feedback seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.35,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Leaders routinely listen and act on what they hear.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Listening happens, but follow-through is inconsistent.",
        "insightPrompt": "What causes concerns to be heard but not consistently acted on afterward?"
      },
      "higherValueOption": "B"
    },
    "order": 33
  },
  {
    "stakeholder": "leader",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Self-Rating",
    "questionCode": "OS-P-L1",
    "questionStem": "Our strategic priorities are clearly defined and consistently reinforced across leadership.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What is causing strategic priorities to feel unclear, inconsistent, or unevenly reinforced across leadership?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 34
  },
  {
    "stakeholder": "leader",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Behavioural",
    "questionCode": "OS-P-LB1",
    "questionStem": "In the past 30 days, how often did you realign priorities to focus on highest-impact outcomes?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What gets in the way of re-prioritizing quickly when higher-impact work emerges?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 35
  },
  {
    "stakeholder": "leader",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Forced-Choice",
    "questionCode": "OS-P-LFC1",
    "questionStem": "Which statement best reflects current prioritization discipline?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "We stop lower-value work to protect critical priorities.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "We add new priorities without removing existing ones.",
        "insightPrompt": "What prevents leaders from removing lower-value work when new priorities are introduced?"
      },
      "higherValueOption": "B"
    },
    "order": 36
  },
  {
    "stakeholder": "leader",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Self-Rating",
    "questionCode": "OS-WC-L1",
    "questionStem": "Decision rights and accountability are clearly defined across teams.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What decisions are being escalated because responsibility or ownership is ambiguous?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 37
  },
  {
    "stakeholder": "leader",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Behavioural",
    "questionCode": "OS-WC-LB1",
    "questionStem": "In the past 30 days, how often did workflow confusion escalate to leadership level?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What recurring sources of workflow confusion are reaching leadership instead of being resolved earlier?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 38
  },
  {
    "stakeholder": "leader",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Forced-Choice",
    "questionCode": "OS-WC-LFC1",
    "questionStem": "Which statement best reflects operational flow?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Roles and responsibilities are clear and work moves smoothly between teams.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Work frequently stalls due to unclear ownership or handoffs.",
        "insightPrompt": "At which ownership points or handoffs does work most often stall?"
      },
      "higherValueOption": "B"
    },
    "order": 39
  },
  {
    "stakeholder": "leader",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Self-Rating",
    "questionCode": "OS-ERM-L1",
    "questionStem": "We allocate budget, people, and time based on strategic priorities rather than legacy patterns.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What legacy habits or constraints are preventing resources from following strategic priorities?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 40
  },
  {
    "stakeholder": "leader",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Behavioural",
    "questionCode": "OS-ERM-LB1",
    "questionStem": "In the past 30 days, how often did capacity constraints delay strategic execution?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are capacity constraints most often delaying execution, and what is driving those bottlenecks?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 41
  },
  {
    "stakeholder": "leader",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Forced-Choice",
    "questionCode": "OS-ERM-LFC1",
    "questionStem": "Which statement best reflects resource alignment?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Resources are proactively shifted to match strategic needs.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Resource allocation changes only after problems escalate.",
        "insightPrompt": "Why does resource reallocation tend to happen only after issues become severe?"
      },
      "higherValueOption": "B"
    },
    "order": 42
  },
  {
    "stakeholder": "leader",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Self-Rating",
    "questionCode": "OS-WC-L2",
    "questionStem": "I feel comfortable coaching my team through new systems, workflows, or service models.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What makes you feel uncomfortable?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 43
  },
  {
    "stakeholder": "leader",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Behavioural",
    "questionCode": "OS-ERM-LB2",
    "questionStem": "Operational improvements are prioritized based on member/client impact.",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "How are operational improvements decided and what can be done?",
    "subdomainWeight": 0.25,
    "isDeleted": false,
    "orgName": null,
    "order": 44
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-DAAR-L1",
    "questionStem": "Leadership decisions are consistently informed by reliable data, analytics and unbiased observations.",
    "scale": "SCALE_1_5",
    "insightPrompt": "How else do you base your decisions, and when do you refer to data?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 45
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Behavioural",
    "questionCode": "DF-DAAR-LB1",
    "questionStem": "In the past 30 days, how often did you use data or analytics to challenge assumptions or refine decisions?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What makes it harder to use data to challenge assumptions before decisions are made?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 46
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DAAR-LFC1",
    "questionStem": "Which statement best reflects digital maturity?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "We proactively leverage automation and AI to increase efficiency and insight.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Automation and AI are discussed but rarely embedded in workflows.",
        "insightPrompt": "What is stopping automation or AI ideas from becoming practical workflow pilots?"
      },
      "higherValueOption": "B"
    },
    "order": 47
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Self-Rating",
    "questionCode": "DF-DCC-L1",
    "questionStem": "Digital tools enable seamless collaboration across teams and functions.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are digital tools failing to support seamless collaboration across teams or functions?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 48
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Behavioural",
    "questionCode": "DF-DCC-LB1",
    "questionStem": "In the past 30 days, how often did digital tools reduce meeting load or increase transparency?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What is preventing digital tools from reducing meeting load or improving transparency in practice?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 49
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DCC-LFC1",
    "questionStem": "Which statement best reflects collaboration effectiveness?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Our digital platforms simplify communication and document sharing.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "We rely heavily on email and manual coordination to move work forward.",
        "insightPrompt": "Where is manual coordination replacing clearer systems, workflows, or shared visibility?"
      },
      "higherValueOption": "B"
    },
    "order": 50
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-MCCR-L1",
    "questionStem": "Senior leaders demonstrate confidence and optimism when adopting new digital initiatives.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What concerns, uncertainties, or past experiences may be reducing leadership confidence in new digital initiatives?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 51
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Behavioural",
    "questionCode": "DF-MCCR-LB1",
    "questionStem": "In the past 30 days, how often did you visibly champion a new digital initiative?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What may be limiting visible leadership sponsorship of new digital initiatives?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 52
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-MCCR-LFC1",
    "questionStem": "Which statement best reflects leadership posture toward digital change?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "We experiment, learn quickly, and iterate.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "We delay adoption until solutions are fully proven elsewhere.",
        "insightPrompt": "What risks or beliefs are causing the organization to wait rather than pilot earlier?"
      },
      "higherValueOption": "B"
    },
    "order": 53
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Self-Rating",
    "questionCode": "DF-TSP-L1",
    "questionStem": "Leaders understand the capabilities and limitations of core enterprise systems.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do leaders lack enough understanding of core systems to make confident decisions about their use?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 54
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Behavioural",
    "questionCode": "DF-TSP-LB1",
    "questionStem": "In the past 30 days, how often did system limitations constrain execution or digitally dependent performance?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Which system limitations are most often constraining execution, and why have they not been addressed?",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "order": 55
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Forced-Choice",
    "questionCode": "DF-TSP-LFC1",
    "questionStem": "Which statement best reflects system effectiveness?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Our systems are integrated and support strategic visibility.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Our systems are fragmented and require manual workarounds.",
        "insightPrompt": "Which fragmented systems are creating the most manual workarounds today?"
      },
      "higherValueOption": "B"
    },
    "order": 56
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Forced-Choice",
    "questionCode": "DF-TSP-LFC2",
    "questionStem": "Which statement best reflects member facing systems effectiveness?",
    "scale": "FORCED_CHOICE",
    "subdomainWeight": 0.2,
    "isDeleted": false,
    "orgName": null,
    "forcedChoice": {
      "optionA": {
        "label": "Our digital channels make it easy for members to find information and resolve issues on their own before contacting staff.",
        "insightPrompt": ""
      },
      "optionB": {
        "label": "Members have not yet adopted or adapted the new tools and resources available to them.",
        "insightPrompt": "What needs to shift or change in order to help Members become more self-serving using the tools and resources available to them?"
      },
      "higherValueOption": "B"
    },
    "order": 57
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");

    // Clear existing master questions
    const deleted = await Question.deleteMany({ orgName: null });
    console.log(`Cleared ${deleted.deletedCount} existing master questions`);

    // Insert all new master questions
    await Question.insertMany(questions, { ordered: false });
    console.log(`Inserted ${questions.length} master questions successfully`);

    process.exit(0);
  } catch (err) {
    if (err.writeErrors) {
      console.log(`Partial insert: ${err.result?.nInserted || 0} ok, ${err.writeErrors.length} failed`);
      err.writeErrors.slice(0, 10).forEach(e => console.error("  -", e.err?.errmsg || e.message));
    } else {
      console.error("Seed error:", err.message);
    }
    process.exit(1);
  }
};

seed();
