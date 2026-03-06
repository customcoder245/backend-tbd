import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "../models/question.model.js";

dotenv.config();

// Fix for DNS resolution issues with MongoDB Atlas SRV records
import dns from "dns";
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
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
    "order": 6,
    "forcedChoice": {
      "optionA": {
        "label": "I understand what to do and feel supported to adapt.",
        "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?"
      },
      "optionB": {
        "label": "I’m unsure what to do and feel left to figure it out on my own.",
        "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Forced-Choice",
    "questionCode": "PP-MA-EFC2",
    "questionStem": "Which statement fits your mindset about change?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
    "order": 7,
    "forcedChoice": {
      "optionA": {
        "label": "I see change as an opportunity to improve.",
        "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?"
      },
      "optionB": {
        "label": "I see change as disruptive and mostly negative.",
        "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Calibration",
    "questionCode": "PP-MA-ECAL1",
    "questionStem": "I can answer honestly about my comfort with change and learning.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
    "order": 8
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Calibration",
    "questionCode": "PP-MA-ECAL2",
    "questionStem": "I am happy with the pace of change in my workplace and supports in place to support me in the transitions.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?",
    "subdomainWeight": 0.35,
    "order": 15,
    "forcedChoice": {
      "optionA": {
        "label": "We discuss priorities and adjust expectations.",
        "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?"
      },
      "optionB": {
        "label": "I’m expected to cope without changes or support.",
        "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Calibration",
    "questionCode": "PP-PHS-ECAL1",
    "questionStem": "I feel safe answering this assessment honestly without fear of consequences.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "order": 22,
    "forcedChoice": {
      "optionA": {
        "label": "We address tensions early and resolve issues respectfully.",
        "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?"
      },
      "optionB": {
        "label": "Tensions linger and problems are avoided or handled indirectly.",
        "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-EFC2",
    "questionStem": "Which statement is closer to your feedback experience?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "order": 23,
    "forcedChoice": {
      "optionA": {
        "label": "Feedback helps me improve and is delivered respectfully.",
        "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?"
      },
      "optionB": {
        "label": "Feedback feels unclear, harsh, or is rarely given.",
        "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Calibration",
    "questionCode": "PP-REI-ECAL1",
    "questionStem": "I can be candid about team dynamics and relationships without worry.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "order": 24
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-E4",
    "questionStem": "My manager/leader shows genuine care for people, not just results.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "order": 25
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-E5",
    "questionStem": "My manager/leader is approachable and responds constructively when concerns are raised.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "order": 26
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-E6",
    "questionStem": "I receive recognition and support that helps me stay engaged and motivated to perform well.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "order": 30,
    "forcedChoice": {
      "optionA": {
        "label": "My leader helps remove barriers so I can do my job well.",
        "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?"
      },
      "optionB": {
        "label": "Barriers remain and I’m expected to manage them on my own.",
        "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-EFC4",
    "questionStem": "Which statement best matches your experience of recognition and respect?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "order": 31,
    "forcedChoice": {
      "optionA": {
        "label": "Effort and contributions are noticed and acknowledged.",
        "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?"
      },
      "optionB": {
        "label": "Effort and contributions often go unnoticed.",
        "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Calibration",
    "questionCode": "PP-REI-ECAL2",
    "questionStem": "I can be honest about leadership support without worry.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are unclear or shifting priorities affecting focus, workload, or performance?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "Where are unclear or shifting priorities affecting focus, workload, or performance?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "Where are unclear or shifting priorities affecting focus, workload, or performance?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "Where are unclear or shifting priorities affecting focus, workload, or performance?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "Where are unclear or shifting priorities affecting focus, workload, or performance?",
    "subdomainWeight": 0.25,
    "order": 37,
    "forcedChoice": {
      "optionA": {
        "label": "Priorities are clear and manageable.",
        "insightPrompt": "Where are unclear or shifting priorities affecting focus, workload, or performance?"
      },
      "optionB": {
        "label": "Priorities change frequently and feel overwhelming.",
        "insightPrompt": "Where are unclear or shifting priorities affecting focus, workload, or performance?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Forced-Choice",
    "questionCode": "OS-P-EFC2",
    "questionStem": "Which statement best reflects workload expectations?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are unclear or shifting priorities affecting focus, workload, or performance?",
    "subdomainWeight": 0.25,
    "order": 38,
    "forcedChoice": {
      "optionA": {
        "label": "Work expectations match available time.",
        "insightPrompt": "Where are unclear or shifting priorities affecting focus, workload, or performance?"
      },
      "optionB": {
        "label": "Work expectations often exceed capacity.",
        "insightPrompt": "Where are unclear or shifting priorities affecting focus, workload, or performance?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Self-Rating",
    "questionCode": "OS-WC-E1",
    "questionStem": "I understand my responsibilities and decision boundaries.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are unclear roles, communication gaps, or workflow breakdowns slowing progress?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "Where are unclear roles, communication gaps, or workflow breakdowns slowing progress?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "Where are unclear roles, communication gaps, or workflow breakdowns slowing progress?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "Where are unclear roles, communication gaps, or workflow breakdowns slowing progress?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "Where are unclear roles, communication gaps, or workflow breakdowns slowing progress?",
    "subdomainWeight": 0.25,
    "order": 43,
    "forcedChoice": {
      "optionA": {
        "label": "Work processes are clear and predictable.",
        "insightPrompt": "Where are unclear roles, communication gaps, or workflow breakdowns slowing progress?"
      },
      "optionB": {
        "label": "Processes frequently require clarification.",
        "insightPrompt": "Where are unclear roles, communication gaps, or workflow breakdowns slowing progress?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Forced-Choice",
    "questionCode": "OS-WC-EFC2",
    "questionStem": "Which statement best reflects communication clarity?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are unclear roles, communication gaps, or workflow breakdowns slowing progress?",
    "subdomainWeight": 0.25,
    "order": 44,
    "forcedChoice": {
      "optionA": {
        "label": "Expectations are clearly communicated.",
        "insightPrompt": "Where are unclear roles, communication gaps, or workflow breakdowns slowing progress?"
      },
      "optionB": {
        "label": "Expectations are often unclear or assumed.",
        "insightPrompt": "Where are unclear roles, communication gaps, or workflow breakdowns slowing progress?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Self-Rating",
    "questionCode": "OS-ERM-E1",
    "questionStem": "I have the tools and resources needed to do my job effectively.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are capacity, tools, or support gaps affecting your ability to perform effectively?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "Where are capacity, tools, or support gaps affecting your ability to perform effectively?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "Where are capacity, tools, or support gaps affecting your ability to perform effectively?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "Where are capacity, tools, or support gaps affecting your ability to perform effectively?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "Where are capacity, tools, or support gaps affecting your ability to perform effectively?",
    "subdomainWeight": 0.25,
    "order": 49,
    "forcedChoice": {
      "optionA": {
        "label": "I receive timely support when issues arise.",
        "insightPrompt": "Where are capacity, tools, or support gaps affecting your ability to perform effectively?"
      },
      "optionB": {
        "label": "Support is slow or difficult to access.",
        "insightPrompt": "Where are capacity, tools, or support gaps affecting your ability to perform effectively?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Forced-Choice",
    "questionCode": "OS-ERM-EFC2",
    "questionStem": "Which statement best reflects workload management?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are capacity, tools, or support gaps affecting your ability to perform effectively?",
    "subdomainWeight": 0.25,
    "order": 50,
    "forcedChoice": {
      "optionA": {
        "label": "Work is adjusted when capacity is strained.",
        "insightPrompt": "Where are capacity, tools, or support gaps affecting your ability to perform effectively?"
      },
      "optionB": {
        "label": "Work continues regardless of strain.",
        "insightPrompt": "Where are capacity, tools, or support gaps affecting your ability to perform effectively?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-DAAR-E1",
    "questionStem": "I have access to the data I need to do my job well.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do data access or automation gaps limit better performance or decision-making?",
    "subdomainWeight": 0.2,
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
    "insightPrompt": "Where do data access or automation gaps limit better performance or decision-making?",
    "subdomainWeight": 0.2,
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
    "insightPrompt": "Where do data access or automation gaps limit better performance or decision-making?",
    "subdomainWeight": 0.2,
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
    "insightPrompt": "Where do data access or automation gaps limit better performance or decision-making?",
    "subdomainWeight": 0.2,
    "order": 54,
    "forcedChoice": {
      "optionA": {
        "label": "Data helps me make informed decisions.",
        "insightPrompt": "Where do data access or automation gaps limit better performance or decision-making?"
      },
      "optionB": {
        "label": "I rely mostly on experience or guesswork.",
        "insightPrompt": "Where do data access or automation gaps limit better performance or decision-making?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DAAR-EFC2",
    "questionStem": "Which statement best reflects automation support?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where do data access or automation gaps limit better performance or decision-making?",
    "subdomainWeight": 0.2,
    "order": 55,
    "forcedChoice": {
      "optionA": {
        "label": "Tools reduce manual effort where possible.",
        "insightPrompt": "Where do data access or automation gaps limit better performance or decision-making?"
      },
      "optionB": {
        "label": "Much work is still manual and repetitive.",
        "insightPrompt": "Where do data access or automation gaps limit better performance or decision-making?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Self-Rating",
    "questionCode": "DF-DCC-E1",
    "questionStem": "Digital platforms make collaboration easier.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do digital tools support or hinder collaboration and visibility?",
    "subdomainWeight": 0.2,
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
    "insightPrompt": "Where do digital tools support or hinder collaboration and visibility?",
    "subdomainWeight": 0.2,
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
    "insightPrompt": "Where do digital tools support or hinder collaboration and visibility?",
    "subdomainWeight": 0.2,
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
    "insightPrompt": "Where do digital tools support or hinder collaboration and visibility?",
    "subdomainWeight": 0.2,
    "order": 59,
    "forcedChoice": {
      "optionA": {
        "label": "Shared tools improve coordination.",
        "insightPrompt": "Where do digital tools support or hinder collaboration and visibility?"
      },
      "optionB": {
        "label": "Coordination depends mostly on email or chats.",
        "insightPrompt": "Where do digital tools support or hinder collaboration and visibility?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DCC-EFC2",
    "questionStem": "Which statement best reflects communication clarity?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where do digital tools support or hinder collaboration and visibility?",
    "subdomainWeight": 0.2,
    "order": 60,
    "forcedChoice": {
      "optionA": {
        "label": "Updates are transparent and accessible.",
        "insightPrompt": "Where do digital tools support or hinder collaboration and visibility?"
      },
      "optionB": {
        "label": "Information is scattered or siloed.",
        "insightPrompt": "Where do digital tools support or hinder collaboration and visibility?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-MCCR-E1",
    "questionStem": "I feel confident using new digital tools.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is hesitation or uncertainty slowing digital adoption?",
    "subdomainWeight": 0.2,
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
    "insightPrompt": "Where is hesitation or uncertainty slowing digital adoption?",
    "subdomainWeight": 0.2,
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
    "insightPrompt": "Where is hesitation or uncertainty slowing digital adoption?",
    "subdomainWeight": 0.2,
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
    "insightPrompt": "Where is hesitation or uncertainty slowing digital adoption?",
    "subdomainWeight": 0.2,
    "order": 64,
    "forcedChoice": {
      "optionA": {
        "label": "I am open and willing to adapt.",
        "insightPrompt": "Where is hesitation or uncertainty slowing digital adoption?"
      },
      "optionB": {
        "label": "I prefer sticking with familiar methods.",
        "insightPrompt": "Where is hesitation or uncertainty slowing digital adoption?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-MCCR-EFC2",
    "questionStem": "Which statement best reflects learning support?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where is hesitation or uncertainty slowing digital adoption?",
    "subdomainWeight": 0.2,
    "order": 65,
    "forcedChoice": {
      "optionA": {
        "label": "Training and help are available when needed.",
        "insightPrompt": "Where is hesitation or uncertainty slowing digital adoption?"
      },
      "optionB": {
        "label": "Support is limited or inconsistent.",
        "insightPrompt": "Where is hesitation or uncertainty slowing digital adoption?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Self-Rating",
    "questionCode": "DF-TSP-E1",
    "questionStem": "I know how to use core systems effectively.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do system usability or skill gaps create friction in your daily work?",
    "subdomainWeight": 0.2,
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
    "insightPrompt": "Where do system usability or skill gaps create friction in your daily work?",
    "subdomainWeight": 0.2,
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
    "insightPrompt": "Where do system usability or skill gaps create friction in your daily work?",
    "subdomainWeight": 0.2,
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
    "insightPrompt": "Where do system usability or skill gaps create friction in your daily work?",
    "subdomainWeight": 0.2,
    "order": 69,
    "forcedChoice": {
      "optionA": {
        "label": "Systems support efficient work.",
        "insightPrompt": "Where do system usability or skill gaps create friction in your daily work?"
      },
      "optionB": {
        "label": "Systems require frequent workarounds.",
        "insightPrompt": "Where do system usability or skill gaps create friction in your daily work?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "employee",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Forced-Choice",
    "questionCode": "DF-TSP-EFC2",
    "questionStem": "Which statement best reflects training effectiveness?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where do system usability or skill gaps create friction in your daily work?",
    "subdomainWeight": 0.2,
    "order": 70,
    "forcedChoice": {
      "optionA": {
        "label": "Training prepares me well to use systems.",
        "insightPrompt": "Where do system usability or skill gaps create friction in your daily work?"
      },
      "optionB": {
        "label": "I mostly learn systems on my own.",
        "insightPrompt": "Where do system usability or skill gaps create friction in your daily work?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-M1",
    "questionStem": "I coach my team through change by focusing on learning, experimentation, and progress.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What’s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What’s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What’s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What’s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What’s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What’s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?",
    "subdomainWeight": 0.35,
    "order": 6,
    "forcedChoice": {
      "optionA": {
        "label": "With support, practice, and follow-up.",
        "insightPrompt": "What’s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?"
      },
      "optionB": {
        "label": "Announced and we move on without support.",
        "insightPrompt": "What’s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Forced-Choice",
    "questionCode": "PP-MA-MFC2",
    "questionStem": "Which best reflects how setbacks are treated?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "What’s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?",
    "subdomainWeight": 0.35,
    "order": 7,
    "forcedChoice": {
      "optionA": {
        "label": "As learning opportunities.",
        "insightPrompt": "What’s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?"
      },
      "optionB": {
        "label": "As failures to avoid.",
        "insightPrompt": "What’s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-M1",
    "questionStem": "I actively create an environment where team members can speak up without fear.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "order": 10
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionCode": "PP-PHS-MB1",
    "questionStem": "In the past 30 days, how often did you invite dissenting views or bad news in team discussions?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "order": 11
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionCode": "PP-PHS-MB2",
    "questionStem": "In the past 30 days, how often did you adjust priorities/capacity to protect wellbeing?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "order": 12
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Forced-Choice",
    "questionCode": "PP-PHS-MFC1",
    "questionStem": "Which statement best matches your typical response to concerns?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "order": 13,
    "forcedChoice": {
      "optionA": {
        "label": "I respond with curiosity and action.",
        "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?"
      },
      "optionB": {
        "label": "I respond defensively or delay addressing it.",
        "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Forced-Choice",
    "questionCode": "PP-PHS-MFC2",
    "questionStem": "Which statement best matches your team’s experience with mistakes?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "order": 14,
    "forcedChoice": {
      "optionA": {
        "label": "Mistakes are treated as learning without blame.",
        "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?"
      },
      "optionB": {
        "label": "Mistakes often trigger blame or embarrassment.",
        "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Calibration",
    "questionCode": "PP-PHS-MCAL1",
    "questionStem": "I can be honest about psychological safety on my team without fear of repercussions.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "order": 15
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-M4",
    "questionStem": "People on my team are treated fairly and respectfully, regardless of role or background.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "order": 16
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-M5",
    "questionStem": "I act quickly when I see exclusion, favoritism, or disrespect.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "order": 17
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-M6",
    "questionStem": "People feel safe raising concerns about fairness or inclusion.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "order": 18
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionCode": "PP-PHS-MB3",
    "questionStem": "In the past 30 days, how often did you address a fairness or inclusion issue directly?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "order": 19
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionCode": "PP-PHS-MB4",
    "questionStem": "In the past 30 days, how often did you ensure quieter voices were included in decisions?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "order": 20
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Forced-Choice",
    "questionCode": "PP-PHS-MFC3",
    "questionStem": "Which best reflects your team’s experience?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "order": 21,
    "forcedChoice": {
      "optionA": {
        "label": "Decisions feel fair and transparent.",
        "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?"
      },
      "optionB": {
        "label": "Decisions feel inconsistent or influenced by politics.",
        "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Forced-Choice",
    "questionCode": "PP-PHS-MFC4",
    "questionStem": "Which best reflects how inclusion is experienced?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "order": 22,
    "forcedChoice": {
      "optionA": {
        "label": "People feel they belong and can contribute fully.",
        "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?"
      },
      "optionB": {
        "label": "Some people feel excluded or overlooked.",
        "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Calibration",
    "questionCode": "PP-PHS-MCAL2",
    "questionStem": "I feel confident in my ability to foster psychological safety and trust on my team.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "order": 23
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-M1",
    "questionStem": "I handle conflict and difficult conversations calmly and constructively.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where does communication from you or within your team break down or create confusion?",
    "subdomainWeight": 0.35,
    "order": 24
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-M2",
    "questionStem": "I build trust by following through consistently and listening with empathy.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where does communication from you or within your team break down or create confusion?",
    "subdomainWeight": 0.35,
    "order": 25
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-M3",
    "questionStem": "I encourage open dialogue and honest feedback across my team.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where does communication from you or within your team break down or create confusion?",
    "subdomainWeight": 0.35,
    "order": 26
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-MB1",
    "questionStem": "In the past 30 days, how often did you give timely, specific feedback that improved performance?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where does communication from you or within your team break down or create confusion?",
    "subdomainWeight": 0.35,
    "order": 27
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-MB2",
    "questionStem": "In the past 30 days, how often did you resolve a tension before it affected outcomes?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where does communication from you or within your team break down or create confusion?",
    "subdomainWeight": 0.35,
    "order": 28
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-MFC1",
    "questionStem": "I ensure that team understands the “why” behind decisions.",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where does communication from you or within your team break down or create confusion?",
    "subdomainWeight": 0.35,
    "order": 29
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-MFC2",
    "questionStem": "I address performance issues directly and respectfully.",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where does communication from you or within your team break down or create confusion?",
    "subdomainWeight": 0.35,
    "order": 30
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Self-Rating",
    "questionCode": "OS-P-M1",
    "questionStem": "My team understands the top priorities and how they connect to organizational goals.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is priority overload or unclear trade-offs creating rework, delays, or stress—and what should be stopped, sequenced, or clarified?",
    "subdomainWeight": 0.25,
    "order": 31
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Self-Rating",
    "questionCode": "OS-P-M2",
    "questionStem": "I make clear trade-offs when new work emerges (what we will stop, defer, or de-scope).",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is priority overload or unclear trade-offs creating rework, delays, or stress—and what should be stopped, sequenced, or clarified?",
    "subdomainWeight": 0.25,
    "order": 32
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Behavioural",
    "questionCode": "OS-P-MB1",
    "questionStem": "In the past 30 days, how often did you re-prioritize work to protect focus on the highest-impact outcomes?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where is priority overload or unclear trade-offs creating rework, delays, or stress—and what should be stopped, sequenced, or clarified?",
    "subdomainWeight": 0.25,
    "order": 33
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Behavioural",
    "questionCode": "OS-P-MB2",
    "questionStem": "In the past 30 days, how often did urgent requests disrupt planned priorities for your team?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where is priority overload or unclear trade-offs creating rework, delays, or stress—and what should be stopped, sequenced, or clarified?",
    "subdomainWeight": 0.25,
    "order": 34
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Forced-Choice",
    "questionCode": "OS-P-MFC1",
    "questionStem": "Which statement best reflects your team’s prioritization discipline?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where is priority overload or unclear trade-offs creating rework, delays, or stress—and what should be stopped, sequenced, or clarified?",
    "subdomainWeight": 0.25,
    "order": 35,
    "forcedChoice": {
      "optionA": {
        "label": "We regularly review priorities and remove lower-value work.",
        "insightPrompt": "Where is priority overload or unclear trade-offs creating rework, delays, or stress—and what should be stopped, sequenced, or clarified?"
      },
      "optionB": {
        "label": "Work accumulates and we try to do everything.",
        "insightPrompt": "Where is priority overload or unclear trade-offs creating rework, delays, or stress—and what should be stopped, sequenced, or clarified?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Forced-Choice",
    "questionCode": "OS-P-MFC2",
    "questionStem": "Which statement best reflects how priorities are communicated?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where is priority overload or unclear trade-offs creating rework, delays, or stress—and what should be stopped, sequenced, or clarified?",
    "subdomainWeight": 0.25,
    "order": 36,
    "forcedChoice": {
      "optionA": {
        "label": "Priorities are simple, visible, and consistently reinforced.",
        "insightPrompt": "Where is priority overload or unclear trade-offs creating rework, delays, or stress—and what should be stopped, sequenced, or clarified?"
      },
      "optionB": {
        "label": "Priorities change often or are interpreted differently across people.",
        "insightPrompt": "Where is priority overload or unclear trade-offs creating rework, delays, or stress—and what should be stopped, sequenced, or clarified?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Self-Rating",
    "questionCode": "OS-WC-M1",
    "questionStem": "Roles, responsibilities, and decision ownership are clear within my team.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are handoffs, decision rights, or unclear ownership slowing execution—and what processes or roles need to be clarified?",
    "subdomainWeight": 0.25,
    "order": 37
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Self-Rating",
    "questionCode": "OS-WC-M2",
    "questionStem": "Workflows and handoffs with other teams are clear enough to prevent avoidable delays or rework.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are handoffs, decision rights, or unclear ownership slowing execution—and what processes or roles need to be clarified?",
    "subdomainWeight": 0.25,
    "order": 38
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Behavioural",
    "questionCode": "OS-WC-MB1",
    "questionStem": "In the past 30 days, how often did unclear ownership or handoffs delay delivery?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are handoffs, decision rights, or unclear ownership slowing execution—and what processes or roles need to be clarified?",
    "subdomainWeight": 0.25,
    "order": 39
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Behavioural",
    "questionCode": "OS-WC-MB2",
    "questionStem": "In the past 30 days, how often did decisions get stuck waiting for approvals or escalation?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are handoffs, decision rights, or unclear ownership slowing execution—and what processes or roles need to be clarified?",
    "subdomainWeight": 0.25,
    "order": 40
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Forced-Choice",
    "questionCode": "OS-WC-MFC1",
    "questionStem": "Which statement best reflects day-to-day operational flow?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are handoffs, decision rights, or unclear ownership slowing execution—and what processes or roles need to be clarified?",
    "subdomainWeight": 0.25,
    "order": 41,
    "forcedChoice": {
      "optionA": {
        "label": "Work moves smoothly with predictable handoffs and clear accountability.",
        "insightPrompt": "Where are handoffs, decision rights, or unclear ownership slowing execution—and what processes or roles need to be clarified?"
      },
      "optionB": {
        "label": "Work often stalls due to unclear ownership, approvals, or rework.",
        "insightPrompt": "Where are handoffs, decision rights, or unclear ownership slowing execution—and what processes or roles need to be clarified?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Forced-Choice",
    "questionCode": "OS-WC-MFC2",
    "questionStem": "Which statement best reflects decision-making on your work?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are handoffs, decision rights, or unclear ownership slowing execution—and what processes or roles need to be clarified?",
    "subdomainWeight": 0.25,
    "order": 42,
    "forcedChoice": {
      "optionA": {
        "label": "Decision rights are clear and teams can act without unnecessary escalation.",
        "insightPrompt": "Where are handoffs, decision rights, or unclear ownership slowing execution—and what processes or roles need to be clarified?"
      },
      "optionB": {
        "label": "Decisions are unclear and frequently require escalation to move forward.",
        "insightPrompt": "Where are handoffs, decision rights, or unclear ownership slowing execution—and what processes or roles need to be clarified?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Self-Rating",
    "questionCode": "OS-ERM-M1",
    "questionStem": "My team has sufficient capacity (time/people) to meet current expectations without sustained overload.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are capacity, skills, budget, or tools misaligned to expectations—and what reallocations or protections are needed to stabilize delivery?",
    "subdomainWeight": 0.25,
    "order": 43
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Self-Rating",
    "questionCode": "OS-ERM-M2",
    "questionStem": "I plan and allocate resources proactively to match peaks in demand and key deliverables.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are capacity, skills, budget, or tools misaligned to expectations—and what reallocations or protections are needed to stabilize delivery?",
    "subdomainWeight": 0.25,
    "order": 44
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Behavioural",
    "questionCode": "OS-ERM-MB1",
    "questionStem": "In the past 30 days, how often did capacity constraints require you to delay, de-scope, or re-sequence commitments?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are capacity, skills, budget, or tools misaligned to expectations—and what reallocations or protections are needed to stabilize delivery?",
    "subdomainWeight": 0.25,
    "order": 45
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Behavioural",
    "questionCode": "OS-ERM-MB2",
    "questionStem": "In the past 30 days, how often did you escalate resource gaps (skills/tools/budget) before they impacted outcomes?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are capacity, skills, budget, or tools misaligned to expectations—and what reallocations or protections are needed to stabilize delivery?",
    "subdomainWeight": 0.25,
    "order": 46
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Forced-Choice",
    "questionCode": "OS-ERM-MFC1",
    "questionStem": "Which statement best reflects how your team manages capacity?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are capacity, skills, budget, or tools misaligned to expectations—and what reallocations or protections are needed to stabilize delivery?",
    "subdomainWeight": 0.25,
    "order": 47,
    "forcedChoice": {
      "optionA": {
        "label": "We regularly assess capacity and adjust commitments before issues escalate.",
        "insightPrompt": "Where are capacity, skills, budget, or tools misaligned to expectations—and what reallocations or protections are needed to stabilize delivery?"
      },
      "optionB": {
        "label": "We absorb extra work until stress or quality issues force changes.",
        "insightPrompt": "Where are capacity, skills, budget, or tools misaligned to expectations—and what reallocations or protections are needed to stabilize delivery?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Forced-Choice",
    "questionCode": "OS-ERM-MFC2",
    "questionStem": "Which statement best reflects resource allocation decisions?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are capacity, skills, budget, or tools misaligned to expectations—and what reallocations or protections are needed to stabilize delivery?",
    "subdomainWeight": 0.25,
    "order": 48,
    "forcedChoice": {
      "optionA": {
        "label": "Resources are aligned to priorities and shifted when needed.",
        "insightPrompt": "Where are capacity, skills, budget, or tools misaligned to expectations—and what reallocations or protections are needed to stabilize delivery?"
      },
      "optionB": {
        "label": "Resources are fixed, and priorities compete without reallocation.",
        "insightPrompt": "Where are capacity, skills, budget, or tools misaligned to expectations—and what reallocations or protections are needed to stabilize delivery?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-DAAR-M1",
    "questionStem": "I use relevant data/metrics to guide team decisions and performance discussions.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do data quality, access, or literacy gaps limit decision-making—and what automation/AI opportunities are realistic in the next 6–12 months?",
    "subdomainWeight": 0.2,
    "order": 49
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-DAAR-M2",
    "questionStem": "Our team has access to reliable data (timely, accurate, trusted) to do our work effectively.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do data quality, access, or literacy gaps limit decision-making—and what automation/AI opportunities are realistic in the next 6–12 months?",
    "subdomainWeight": 0.2,
    "order": 50
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Behavioural",
    "questionCode": "DF-DAAR-MB1",
    "questionStem": "In the past 30 days, how often did you use data to challenge assumptions or adjust a decision?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where do data quality, access, or literacy gaps limit decision-making—and what automation/AI opportunities are realistic in the next 6–12 months?",
    "subdomainWeight": 0.2,
    "order": 51
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DAAR-MFC1",
    "questionStem": "Which statement best reflects how data is used in your area?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where do data quality, access, or literacy gaps limit decision-making—and what automation/AI opportunities are realistic in the next 6–12 months?",
    "subdomainWeight": 0.2,
    "order": 52,
    "forcedChoice": {
      "optionA": {
        "label": "Data is accessible and influences decisions and priorities.",
        "insightPrompt": "Where do data quality, access, or literacy gaps limit decision-making—and what automation/AI opportunities are realistic in the next 6–12 months?"
      },
      "optionB": {
        "label": "Data is hard to access, inconsistent, or rarely used in decisions.",
        "insightPrompt": "Where do data quality, access, or literacy gaps limit decision-making—and what automation/AI opportunities are realistic in the next 6–12 months?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DAAR-MFC2",
    "questionStem": "Which statement best reflects automation/AI readiness?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where do data quality, access, or literacy gaps limit decision-making—and what automation/AI opportunities are realistic in the next 6–12 months?",
    "subdomainWeight": 0.2,
    "order": 53,
    "forcedChoice": {
      "optionA": {
        "label": "We have identified repeatable work that could be automated and are testing improvements.",
        "insightPrompt": "Where do data quality, access, or literacy gaps limit decision-making—and what automation/AI opportunities are realistic in the next 6–12 months?"
      },
      "optionB": {
        "label": "Automation/AI is discussed, but we haven’t translated it into practical pilots.",
        "insightPrompt": "Where do data quality, access, or literacy gaps limit decision-making—and what automation/AI opportunities are realistic in the next 6–12 months?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Self-Rating",
    "questionCode": "DF-DCC-M1",
    "questionStem": "Our team uses digital collaboration tools to share work status, decisions, and documentation transparently.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do collaboration tools help or hinder execution (visibility, coordination, decision capture)—and what would reduce meeting/email load?",
    "subdomainWeight": 0.2,
    "order": 54
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Self-Rating",
    "questionCode": "DF-DCC-M2",
    "questionStem": "Cross-team collaboration is effective because information is easy to find and up to date.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do collaboration tools help or hinder execution (visibility, coordination, decision capture)—and what would reduce meeting/email load?",
    "subdomainWeight": 0.2,
    "order": 55
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Behavioural",
    "questionCode": "DF-DCC-MB1",
    "questionStem": "In the past 30 days, how often did digital tools reduce the need for meetings or follow-up emails?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where do collaboration tools help or hinder execution (visibility, coordination, decision capture)—and what would reduce meeting/email load?",
    "subdomainWeight": 0.2,
    "order": 56
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DCC-MFC1",
    "questionStem": "Which statement best reflects communication efficiency?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where do collaboration tools help or hinder execution (visibility, coordination, decision capture)—and what would reduce meeting/email load?",
    "subdomainWeight": 0.2,
    "order": 57,
    "forcedChoice": {
      "optionA": {
        "label": "Information is centralized and easy to locate; updates are visible to those who need them.",
        "insightPrompt": "Where do collaboration tools help or hinder execution (visibility, coordination, decision capture)—and what would reduce meeting/email load?"
      },
      "optionB": {
        "label": "Information is scattered across emails/chats/files; people often ask for the latest version.",
        "insightPrompt": "Where do collaboration tools help or hinder execution (visibility, coordination, decision capture)—and what would reduce meeting/email load?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DCC-MFC2",
    "questionStem": "Which statement best reflects cross-team coordination?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where do collaboration tools help or hinder execution (visibility, coordination, decision capture)—and what would reduce meeting/email load?",
    "subdomainWeight": 0.2,
    "order": 58,
    "forcedChoice": {
      "optionA": {
        "label": "Shared tools and practices make coordination smooth and predictable.",
        "insightPrompt": "Where do collaboration tools help or hinder execution (visibility, coordination, decision capture)—and what would reduce meeting/email load?"
      },
      "optionB": {
        "label": "Coordination relies on manual follow-ups and individual effort.",
        "insightPrompt": "Where do collaboration tools help or hinder execution (visibility, coordination, decision capture)—and what would reduce meeting/email load?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-MCCR-M1",
    "questionStem": "I feel confident leading digital change within my team (new tools, processes, or ways of working).",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where does hesitation, risk aversion, or change fatigue slow digital adoption—and what support or reinforcement would increase confidence?",
    "subdomainWeight": 0.2,
    "order": 59
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-MCCR-M2",
    "questionStem": "My team generally approaches new digital ways of working with openness rather than resistance.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where does hesitation, risk aversion, or change fatigue slow digital adoption—and what support or reinforcement would increase confidence?",
    "subdomainWeight": 0.2,
    "order": 60
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Behavioural",
    "questionCode": "DF-MCCR-MB1",
    "questionStem": "In the past 30 days, how often did you visibly champion or model adoption of a new digital practice?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where does hesitation, risk aversion, or change fatigue slow digital adoption—and what support or reinforcement would increase confidence?",
    "subdomainWeight": 0.2,
    "order": 61
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-MCCR-MFC1",
    "questionStem": "Which statement best reflects your team’s approach to digital change?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where does hesitation, risk aversion, or change fatigue slow digital adoption—and what support or reinforcement would increase confidence?",
    "subdomainWeight": 0.2,
    "order": 62,
    "forcedChoice": {
      "optionA": {
        "label": "We experiment, learn quickly, and improve as we go.",
        "insightPrompt": "Where does hesitation, risk aversion, or change fatigue slow digital adoption—and what support or reinforcement would increase confidence?"
      },
      "optionB": {
        "label": "We delay adoption until solutions feel fully proven and low-risk.",
        "insightPrompt": "Where does hesitation, risk aversion, or change fatigue slow digital adoption—and what support or reinforcement would increase confidence?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-MCCR-MFC2",
    "questionStem": "Which statement best reflects the support environment for change?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where does hesitation, risk aversion, or change fatigue slow digital adoption—and what support or reinforcement would increase confidence?",
    "subdomainWeight": 0.2,
    "order": 63,
    "forcedChoice": {
      "optionA": {
        "label": "People have time, guidance, and reinforcement to build confidence with new tools.",
        "insightPrompt": "Where does hesitation, risk aversion, or change fatigue slow digital adoption—and what support or reinforcement would increase confidence?"
      },
      "optionB": {
        "label": "People are expected to adapt quickly with limited time or support.",
        "insightPrompt": "Where does hesitation, risk aversion, or change fatigue slow digital adoption—and what support or reinforcement would increase confidence?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Self-Rating",
    "questionCode": "DF-TSP-M1",
    "questionStem": "My team understands how to use core tools/systems effectively to complete work with minimal friction.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do system/tool usability, integration, or skill gaps create workarounds—and what would most improve proficiency and efficiency?",
    "subdomainWeight": 0.2,
    "order": 64
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Self-Rating",
    "questionCode": "DF-TSP-M2",
    "questionStem": "Our tools and systems are integrated enough to avoid frequent manual workarounds or duplicate entry.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do system/tool usability, integration, or skill gaps create workarounds—and what would most improve proficiency and efficiency?",
    "subdomainWeight": 0.2,
    "order": 65
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Behavioural",
    "questionCode": "DF-TSP-MB1",
    "questionStem": "In the past 30 days, how often did tool/system limitations require manual workarounds or rework?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where do system/tool usability, integration, or skill gaps create workarounds—and what would most improve proficiency and efficiency?",
    "subdomainWeight": 0.2,
    "order": 66
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Forced-Choice",
    "questionCode": "DF-TSP-MFC1",
    "questionStem": "Which statement best reflects system usability?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where do system/tool usability, integration, or skill gaps create workarounds—and what would most improve proficiency and efficiency?",
    "subdomainWeight": 0.2,
    "order": 67,
    "forcedChoice": {
      "optionA": {
        "label": "Core systems are intuitive and support efficient work.",
        "insightPrompt": "Where do system/tool usability, integration, or skill gaps create workarounds—and what would most improve proficiency and efficiency?"
      },
      "optionB": {
        "label": "Core systems are confusing or slow, so people avoid them when possible.",
        "insightPrompt": "Where do system/tool usability, integration, or skill gaps create workarounds—and what would most improve proficiency and efficiency?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "manager",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Forced-Choice",
    "questionCode": "DF-TSP-MFC2",
    "questionStem": "Which statement best reflects capability building?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where do system/tool usability, integration, or skill gaps create workarounds—and what would most improve proficiency and efficiency?",
    "subdomainWeight": 0.2,
    "order": 68,
    "forcedChoice": {
      "optionA": {
        "label": "We have effective onboarding/training and quick support when issues arise.",
        "insightPrompt": "Where do system/tool usability, integration, or skill gaps create workarounds—and what would most improve proficiency and efficiency?"
      },
      "optionB": {
        "label": "Training/support is inconsistent; people mostly learn by trial and error.",
        "insightPrompt": "Where do system/tool usability, integration, or skill gaps create workarounds—and what would most improve proficiency and efficiency?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-L1",
    "questionStem": "I model behaviours that make it safe to raise risks, concerns, and mistakes.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "order": 1
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-A1",
    "questionStem": "I model behaviours that make it safe to raise risks, concerns, and mistakes.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "order": 2
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-A2",
    "questionStem": "I hold others accountable for behaviours that undermine respect, inclusion, or safety.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "order": 3
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-A3",
    "questionStem": "Psychological safety and wellbeing are embedded in leadership expectations and performance.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "order": 4
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionCode": "PP-PHS-A4",
    "questionStem": "We allocate time/resources to reduce workload pressure and burnout risk.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "order": 5
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionCode": "PP-PHS-AB1",
    "questionStem": "In the past 30 days, how often did you address a behaviour/practice that reduced psychological safety?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "order": 6
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionCode": "PP-PHS-AB2",
    "questionStem": "In the past 30 days, how often did you sponsor actions to reduce workload/stress hotspots?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "order": 7
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionCode": "PP-PHS-AB3",
    "questionStem": "In the past 30 days, how often did you seek unfiltered feedback from frontline teams?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "order": 8
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-A1",
    "questionStem": "We invest in the skills and learning required for our future strategy (not just today’s needs).",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "order": 9
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-A2",
    "questionStem": "We adapt strategy and priorities quickly when conditions change.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "order": 10
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-A3",
    "questionStem": "We remove barriers so teams can experiment, learn, and improve ways of working.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "order": 10
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-L4",
    "questionStem": "We reinforce change with follow-through (practice, measurement, recognition).",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "order": 11
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionCode": "PP-MA-A4",
    "questionStem": "We reinforce change with follow-through (practice, measurement, recognition).",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "order": 12
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionCode": "PP-MA-AB1",
    "questionStem": "In the past 30 days, how often did you remove a structural barrier slowing learning/adoption?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "order": 13
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionCode": "PP-MA-AB2",
    "questionStem": "In the past 30 days, how often did you re-prioritize to focus on highest-value outcomes?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "order": 14
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionCode": "PP-MA-AB3",
    "questionStem": "In the past 30 days, how often did you sponsor capability-building (training/coaching)?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "order": 14
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Calibration",
    "questionCode": "PP-MA-LCAL1",
    "questionStem": "I can be candid about our organization’s ability to learn and adapt at pace.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "order": 15
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Calibration",
    "questionCode": "PP-MA-ACAL1",
    "questionStem": "I can be candid about our organization’s ability to learn and adapt at pace.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
    "order": 16
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-A1",
    "questionStem": "We build trust through consistent leadership behaviour and follow-through.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
    "order": 17
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-A2",
    "questionStem": "Cross-team collaboration is expected and actively enabled by leaders and managers.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
    "order": 18
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-A3",
    "questionStem": "We address politics, misalignment, and conflict quickly and constructively.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
    "order": 19
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-A4",
    "questionStem": "People feel recognized and connected to purpose, not just tasks.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
    "order": 20
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-AB1",
    "questionStem": "In the past 30 days, how often did you intervene to remove cross-team friction?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
    "order": 21
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-AB2",
    "questionStem": "In the past 30 days, how often did you recognize behaviours that strengthen collaboration and trust?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
    "order": 22
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-AB3",
    "questionStem": "In the past 30 days, how often did you address misalignment between leaders/teams?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
    "order": 23,
    "forcedChoice": {
      "optionA": {
        "label": "Collaboration is the norm and supported by leadership.",
        "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?"
      },
      "optionB": {
        "label": "Collaboration is difficult due to silos/politics/unclear expectations.",
        "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-AFC1",
    "questionStem": "Which statement about collaboration seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
    "order": 23,
    "forcedChoice": {
      "optionA": {
        "label": "Collaboration is the norm and supported by leadership.",
        "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?"
      },
      "optionB": {
        "label": "Collaboration is difficult due to silos/politics/unclear expectations.",
        "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-LFC2",
    "questionStem": "Which statement about working execution seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
    "order": 24,
    "forcedChoice": {
      "optionA": {
        "label": "People feel valued and connected to the mission.",
        "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?"
      },
      "optionB": {
        "label": "People feel like execution matters more than people.",
        "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-AFC2",
    "questionStem": "Which statement about working execution seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?",
    "subdomainWeight": 0.35,
    "order": 24,
    "forcedChoice": {
      "optionA": {
        "label": "People feel valued and connected to the mission.",
        "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?"
      },
      "optionB": {
        "label": "People feel like execution matters more than people.",
        "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak—and why?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-L5",
    "questionStem": "Leadership communication is clear, consistent, and aligned across leaders.",
    "scale": "SCALE_1_5",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "order": 25
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-A5",
    "questionStem": "Leadership communication is clear, consistent, and aligned across leaders.",
    "scale": "SCALE_1_5",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "order": 25
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-L6",
    "questionStem": "We explain “why” behind decisions and the implications for teams.",
    "scale": "SCALE_1_5",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "order": 26
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-A6",
    "questionStem": "We explain “why” behind decisions and the implications for teams.",
    "scale": "SCALE_1_5",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "order": 27
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-A7",
    "questionStem": "Leaders are visible and accessible enough to maintain trust and reduce uncertainty.",
    "scale": "SCALE_1_5",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "order": 28
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionCode": "PP-REI-A8",
    "questionStem": "Communication is delivered with empathy and acknowledges real constraints on teams.",
    "scale": "SCALE_1_5",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "order": 29
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-AB4",
    "questionStem": "In the past 30 days, how often did you communicate a decision with clear rationale and impacts?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "order": 30
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-AB5",
    "questionStem": "In the past 30 days, how often did you engage directly with frontline teams to listen/respond?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "order": 31
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionCode": "PP-REI-AB6",
    "questionStem": "In the past 30 days, how often did you correct mixed messages or misalignment between leaders?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
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
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "order": 32,
    "forcedChoice": {
      "optionA": {
        "label": "People experience leadership communication as consistent and credible.",
        "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?"
      },
      "optionB": {
        "label": "People experience leadership communication as mixed or conflicting.",
        "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-AFC3",
    "questionStem": "Which statement about leadership communication seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "order": 32,
    "forcedChoice": {
      "optionA": {
        "label": "People experience leadership communication as consistent and credible.",
        "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?"
      },
      "optionB": {
        "label": "People experience leadership communication as mixed or conflicting.",
        "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-LFC4",
    "questionStem": "Which statement about leadership listening and feedback seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "order": 33,
    "forcedChoice": {
      "optionA": {
        "label": "Leaders routinely listen and act on what they hear.",
        "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?"
      },
      "optionB": {
        "label": "Listening happens, but follow-through is inconsistent.",
        "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionCode": "PP-REI-AFC4",
    "questionStem": "Which statement about leadership listening and feedback seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "order": 33,
    "forcedChoice": {
      "optionA": {
        "label": "Leaders routinely listen and act on what they hear.",
        "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?"
      },
      "optionB": {
        "label": "Listening happens, but follow-through is inconsistent.",
        "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "leader",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Self-Rating",
    "questionCode": "OS-P-L1",
    "questionStem": "Our strategic priorities are clearly defined and consistently reinforced across leadership.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do competing priorities create friction or confusion at the senior level?",
    "subdomainWeight": 0.25,
    "order": 34
  },
  {
    "stakeholder": "admin",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Self-Rating",
    "questionCode": "OS-P-A1",
    "questionStem": "Our strategic priorities are clearly defined and consistently reinforced across leadership.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where do competing priorities create friction or confusion at the senior level?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "How frequently are leaders adjusting focus to reduce operational drag?",
    "subdomainWeight": 0.25,
    "order": 35
  },
  {
    "stakeholder": "admin",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Behavioural",
    "questionCode": "OS-P-AB1",
    "questionStem": "In the past 30 days, how often did you realign priorities to focus on highest-impact outcomes?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "How frequently are leaders adjusting focus to reduce operational drag?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "Is priority overload driving operational instability?",
    "subdomainWeight": 0.25,
    "order": 36,
    "forcedChoice": {
      "optionA": {
        "label": "We stop lower-value work to protect critical priorities.",
        "insightPrompt": "Is priority overload driving operational instability?"
      },
      "optionB": {
        "label": "We add new priorities without removing existing ones.",
        "insightPrompt": "Is priority overload driving operational instability?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "admin",
    "domain": "Operational Steadiness",
    "subdomain": "Prioritization",
    "questionType": "Forced-Choice",
    "questionCode": "OS-P-AFC1",
    "questionStem": "Which statement best reflects current prioritization discipline?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Is priority overload driving operational instability?",
    "subdomainWeight": 0.25,
    "order": 36,
    "forcedChoice": {
      "optionA": {
        "label": "We stop lower-value work to protect critical priorities.",
        "insightPrompt": "Is priority overload driving operational instability?"
      },
      "optionB": {
        "label": "We add new priorities without removing existing ones.",
        "insightPrompt": "Is priority overload driving operational instability?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "leader",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Self-Rating",
    "questionCode": "OS-WC-L1",
    "questionStem": "Decision rights and accountability are clearly defined across teams.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are decision bottlenecks or role ambiguities slowing execution?",
    "subdomainWeight": 0.25,
    "order": 37
  },
  {
    "stakeholder": "admin",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Self-Rating",
    "questionCode": "OS-WC-A1",
    "questionStem": "Decision rights and accountability are clearly defined across teams.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are decision bottlenecks or role ambiguities slowing execution?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "How much executive time is spent resolving avoidable execution friction?",
    "subdomainWeight": 0.25,
    "order": 38
  },
  {
    "stakeholder": "admin",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Behavioural",
    "questionCode": "OS-WC-AB1",
    "questionStem": "In the past 30 days, how often did workflow confusion escalate to leadership level?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "How much executive time is spent resolving avoidable execution friction?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "Are handoff breakdowns creating systemic drag?",
    "subdomainWeight": 0.25,
    "order": 39,
    "forcedChoice": {
      "optionA": {
        "label": "Work moves smoothly across teams with minimal rework.",
        "insightPrompt": "Are handoff breakdowns creating systemic drag?"
      },
      "optionB": {
        "label": "Work frequently stalls due to unclear ownership or handoffs.",
        "insightPrompt": "Are handoff breakdowns creating systemic drag?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "admin",
    "domain": "Operational Steadiness",
    "subdomain": "Workflow Clarity",
    "questionType": "Forced-Choice",
    "questionCode": "OS-WC-AFC1",
    "questionStem": "Which statement best reflects operational flow?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Are handoff breakdowns creating systemic drag?",
    "subdomainWeight": 0.25,
    "order": 39,
    "forcedChoice": {
      "optionA": {
        "label": "Work moves smoothly across teams with minimal rework.",
        "insightPrompt": "Are handoff breakdowns creating systemic drag?"
      },
      "optionB": {
        "label": "Work frequently stalls due to unclear ownership or handoffs.",
        "insightPrompt": "Are handoff breakdowns creating systemic drag?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "leader",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Self-Rating",
    "questionCode": "OS-ERM-L1",
    "questionStem": "We allocate budget, people, and time based on strategic priorities rather than legacy patterns.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Are resources aligned to strategy or constrained by historical decisions?",
    "subdomainWeight": 0.25,
    "order": 40
  },
  {
    "stakeholder": "admin",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Self-Rating",
    "questionCode": "OS-ERM-A1",
    "questionStem": "We allocate budget, people, and time based on strategic priorities rather than legacy patterns.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Are resources aligned to strategy or constrained by historical decisions?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "Where are resource gaps creating instability or burnout risk?",
    "subdomainWeight": 0.25,
    "order": 41
  },
  {
    "stakeholder": "admin",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Behavioural",
    "questionCode": "OS-ERM-AB1",
    "questionStem": "In the past 30 days, how often did capacity constraints delay strategic execution?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are resource gaps creating instability or burnout risk?",
    "subdomainWeight": 0.25,
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
    "insightPrompt": "Is the organization proactive or reactive in resource deployment?",
    "subdomainWeight": 0.25,
    "order": 42,
    "forcedChoice": {
      "optionA": {
        "label": "Resources are proactively shifted to match strategic needs.",
        "insightPrompt": "Is the organization proactive or reactive in resource deployment?"
      },
      "optionB": {
        "label": "Resource allocation changes only after problems escalate.",
        "insightPrompt": "Is the organization proactive or reactive in resource deployment?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "admin",
    "domain": "Operational Steadiness",
    "subdomain": "Effective Resource Management",
    "questionType": "Forced-Choice",
    "questionCode": "OS-ERM-AFC1",
    "questionStem": "Which statement best reflects resource alignment?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Is the organization proactive or reactive in resource deployment?",
    "subdomainWeight": 0.25,
    "order": 42,
    "forcedChoice": {
      "optionA": {
        "label": "Resources are proactively shifted to match strategic needs.",
        "insightPrompt": "Is the organization proactive or reactive in resource deployment?"
      },
      "optionB": {
        "label": "Resource allocation changes only after problems escalate.",
        "insightPrompt": "Is the organization proactive or reactive in resource deployment?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-DAAR-L1",
    "questionStem": "Leadership decisions are consistently informed by reliable data, analytics and unbiased observations.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are data gaps limiting executive confidence and speed?",
    "subdomainWeight": 0.2,
    "order": 43
  },
  {
    "stakeholder": "admin",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-DAAR-A1",
    "questionStem": "Leadership decisions are consistently informed by reliable data, analytics and unbiased observations.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are data gaps limiting executive confidence and speed?",
    "subdomainWeight": 0.2,
    "order": 43
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Behavioural",
    "questionCode": "DF-DAAR-LB1",
    "questionStem": "In the past 30 days, how often did you use data or analytics to challenge assumptions or refine decisions?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Is data shaping strategy or validating pre-made decisions?",
    "subdomainWeight": 0.2,
    "order": 44
  },
  {
    "stakeholder": "admin",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Behavioural",
    "questionCode": "DF-DAAR-AB1",
    "questionStem": "In the past 30 days, how often did you use data or analytics to challenge assumptions or refine decisions?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Is data shaping strategy or validating pre-made decisions?",
    "subdomainWeight": 0.2,
    "order": 44
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DAAR-LFC1",
    "questionStem": "Which statement best reflects digital maturity?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Is digital transformation operationalized or aspirational?",
    "subdomainWeight": 0.2,
    "order": 45,
    "forcedChoice": {
      "optionA": {
        "label": "We proactively leverage automation and AI to increase efficiency and insight.",
        "insightPrompt": "Is digital transformation operationalized or aspirational?"
      },
      "optionB": {
        "label": "Automation and AI are discussed but rarely embedded in workflows.",
        "insightPrompt": "Is digital transformation operationalized or aspirational?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "admin",
    "domain": "Digital Fluency",
    "subdomain": "Data, AI & Automation Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DAAR-AFC1",
    "questionStem": "Which statement best reflects digital maturity?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Is digital transformation operationalized or aspirational?",
    "subdomainWeight": 0.2,
    "order": 45,
    "forcedChoice": {
      "optionA": {
        "label": "We proactively leverage automation and AI to increase efficiency and insight.",
        "insightPrompt": "Is digital transformation operationalized or aspirational?"
      },
      "optionB": {
        "label": "Automation and AI are discussed but rarely embedded in workflows.",
        "insightPrompt": "Is digital transformation operationalized or aspirational?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Self-Rating",
    "questionCode": "DF-DCC-L1",
    "questionStem": "Digital tools enable seamless collaboration across teams and functions.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are digital silos limiting cross-functional flow?",
    "subdomainWeight": 0.2,
    "order": 46
  },
  {
    "stakeholder": "admin",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Self-Rating",
    "questionCode": "DF-DCC-A1",
    "questionStem": "Digital tools enable seamless collaboration across teams and functions.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are digital silos limiting cross-functional flow?",
    "subdomainWeight": 0.2,
    "order": 46
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Behavioural",
    "questionCode": "DF-DCC-LB1",
    "questionStem": "In the past 30 days, how often did digital tools reduce meeting load or increase transparency?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Are tools reducing friction or adding complexity?",
    "subdomainWeight": 0.2,
    "order": 47
  },
  {
    "stakeholder": "admin",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Behavioural",
    "questionCode": "DF-DCC-AB1",
    "questionStem": "In the past 30 days, how often did digital tools reduce meeting load or increase transparency?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Are tools reducing friction or adding complexity?",
    "subdomainWeight": 0.2,
    "order": 47
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DCC-LFC1",
    "questionStem": "Which statement best reflects collaboration effectiveness?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Are collaboration platforms optimized or under-leveraged?",
    "subdomainWeight": 0.2,
    "order": 48,
    "forcedChoice": {
      "optionA": {
        "label": "Our digital platforms simplify communication and document sharing.",
        "insightPrompt": "Are collaboration platforms optimized or under-leveraged?"
      },
      "optionB": {
        "label": "We rely heavily on email and manual coordination to move work forward.",
        "insightPrompt": "Are collaboration platforms optimized or under-leveraged?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "admin",
    "domain": "Digital Fluency",
    "subdomain": "Digital Communication & Collaboration",
    "questionType": "Forced-Choice",
    "questionCode": "DF-DCC-AFC1",
    "questionStem": "Which statement best reflects collaboration effectiveness?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Are collaboration platforms optimized or under-leveraged?",
    "subdomainWeight": 0.2,
    "order": 48,
    "forcedChoice": {
      "optionA": {
        "label": "Our digital platforms simplify communication and document sharing.",
        "insightPrompt": "Are collaboration platforms optimized or under-leveraged?"
      },
      "optionB": {
        "label": "We rely heavily on email and manual coordination to move work forward.",
        "insightPrompt": "Are collaboration platforms optimized or under-leveraged?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-MCCR-L1",
    "questionStem": "Senior leaders demonstrate confidence and optimism when adopting new digital initiatives.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where does hesitation or skepticism slow digital momentum?",
    "subdomainWeight": 0.2,
    "order": 49
  },
  {
    "stakeholder": "admin",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Self-Rating",
    "questionCode": "DF-MCCR-A1",
    "questionStem": "Senior leaders demonstrate confidence and optimism when adopting new digital initiatives.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where does hesitation or skepticism slow digital momentum?",
    "subdomainWeight": 0.2,
    "order": 49
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Behavioural",
    "questionCode": "DF-MCCR-LB1",
    "questionStem": "In the past 30 days, how often did you visibly champion a new digital initiative?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Is leadership modeling digital confidence or delegating it downward?",
    "subdomainWeight": 0.2,
    "order": 50
  },
  {
    "stakeholder": "admin",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Behavioural",
    "questionCode": "DF-MCCR-AB1",
    "questionStem": "In the past 30 days, how often did you visibly champion a new digital initiative?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Is leadership modeling digital confidence or delegating it downward?",
    "subdomainWeight": 0.2,
    "order": 50
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-MCCR-LFC1",
    "questionStem": "Which statement best reflects leadership posture toward digital change?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Is digital risk tolerance aligned with strategic ambition?",
    "subdomainWeight": 0.2,
    "order": 51,
    "forcedChoice": {
      "optionA": {
        "label": "We experiment, learn quickly, and iterate.",
        "insightPrompt": "Is digital risk tolerance aligned with strategic ambition?"
      },
      "optionB": {
        "label": "We delay adoption until solutions are fully proven elsewhere.",
        "insightPrompt": "Is digital risk tolerance aligned with strategic ambition?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "admin",
    "domain": "Digital Fluency",
    "subdomain": "Mindset, Confidence and Change Readiness",
    "questionType": "Forced-Choice",
    "questionCode": "DF-MCCR-AFC1",
    "questionStem": "Which statement best reflects leadership posture toward digital change?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Is digital risk tolerance aligned with strategic ambition?",
    "subdomainWeight": 0.2,
    "order": 51,
    "forcedChoice": {
      "optionA": {
        "label": "We experiment, learn quickly, and iterate.",
        "insightPrompt": "Is digital risk tolerance aligned with strategic ambition?"
      },
      "optionB": {
        "label": "We delay adoption until solutions are fully proven elsewhere.",
        "insightPrompt": "Is digital risk tolerance aligned with strategic ambition?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Self-Rating",
    "questionCode": "DF-TSP-L1",
    "questionStem": "Leaders understand the capabilities and limitations of core enterprise systems.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Are strategic decisions aligned with system realities?",
    "subdomainWeight": 0.2,
    "order": 52
  },
  {
    "stakeholder": "admin",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Self-Rating",
    "questionCode": "DF-TSP-A1",
    "questionStem": "Leaders understand the capabilities and limitations of core enterprise systems.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Are strategic decisions aligned with system realities?",
    "subdomainWeight": 0.2,
    "order": 52
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Behavioural",
    "questionCode": "DF-TSP-LB1",
    "questionStem": "In the past 30 days, how often did system limitations constrain execution or digitally dependent performance?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are system weaknesses driving operational inefficiency?",
    "subdomainWeight": 0.2,
    "order": 53
  },
  {
    "stakeholder": "admin",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Behavioural",
    "questionCode": "DF-TSP-AB1",
    "questionStem": "In the past 30 days, how often did system limitations constrain execution or digitally dependent performance?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are system weaknesses driving operational inefficiency?",
    "subdomainWeight": 0.2,
    "order": 53
  },
  {
    "stakeholder": "leader",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Forced-Choice",
    "questionCode": "DF-TSP-LFC1",
    "questionStem": "Which statement best reflects system effectiveness?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Is system architecture enabling or constraining scale?",
    "subdomainWeight": 0.2,
    "order": 54,
    "forcedChoice": {
      "optionA": {
        "label": "Our systems are integrated and support strategic visibility.",
        "insightPrompt": "Is system architecture enabling or constraining scale?"
      },
      "optionB": {
        "label": "Our systems are fragmented and require manual workarounds.",
        "insightPrompt": "Is system architecture enabling or constraining scale?"
      },
      "higherValueOption": "B"
    }
  },
  {
    "stakeholder": "admin",
    "domain": "Digital Fluency",
    "subdomain": "Tool & System Proficiency",
    "questionType": "Forced-Choice",
    "questionCode": "DF-TSP-AFC1",
    "questionStem": "Which statement best reflects system effectiveness?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Is system architecture enabling or constraining scale?",
    "subdomainWeight": 0.2,
    "order": 54,
    "forcedChoice": {
      "optionA": {
        "label": "Our systems are integrated and support strategic visibility.",
        "insightPrompt": "Is system architecture enabling or constraining scale?"
      },
      "optionB": {
        "label": "Our systems are fragmented and require manual workarounds.",
        "insightPrompt": "Is system architecture enabling or constraining scale?"
      },
      "higherValueOption": "B"
    }
  }
];

const seedQuestions = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected.");

    // 🚩 Delete all existing questions as requested
    console.log("Deleting all existing questions...");
    await Question.deleteMany({});
    console.log("Cleanup complete.");

    console.log(`Starting to seed ${questions.length} questions...`);

    let count = 0;
    for (const qData of questions) {
      await Question.create(qData);
      count++;
      if (count % 20 === 0) console.log(`Processed ${count}...`);
    }

    console.log(`Successfully completed. Total: ${count} questions.`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
};

seedQuestions();
