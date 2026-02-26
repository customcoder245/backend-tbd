import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "../models/question.model.js";

dotenv.config();

const questions = [
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you remove a structural barrier slowing learning/adoption?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-AB1"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you re-prioritize to focus on highest-value outcomes?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-AB2"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you sponsor capability-building (training/coaching)?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-AB3"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Calibration",
    "questionStem": "I can be candid about our organization\u2019s ability to learn and adapt at pace.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-ACAL1"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionStem": "We invest in the skills and learning required for our future strategy (not just today\u2019s needs).",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-A1"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionStem": "We adapt strategy and priorities quickly when conditions change.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-A2"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionStem": "We remove barriers so teams can experiment, learn, and improve ways of working.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-A3"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionStem": "We reinforce change with follow-through (practice, measurement, recognition).",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-A4"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you address a behaviour/practice that reduced psychological safety?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-AB1"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you sponsor actions to reduce workload/stress hotspots?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-AB2"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you seek unfiltered feedback from frontline teams?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-AB3"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "I model behaviours that make it safe to raise risks, concerns, and mistakes.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-A1"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "I hold others accountable for behaviours that undermine respect, inclusion, or safety.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-A2"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "Psychological safety and wellbeing are embedded in leadership expectations and performance.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-A3"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "We allocate time/resources to reduce workload pressure and burnout risk.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-A4"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you intervene to remove cross-team friction?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-AB1"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you recognize behaviours that strengthen collaboration and trust?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-AB2"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you address misalignment between leaders/teams?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-AB3"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you communicate a decision with clear rationale and impacts?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-AB4"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you engage directly with frontline teams to listen/respond?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-AB5"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you correct mixed messages or misalignment between leaders?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-AB6"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement about collaboration seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "Collaboration is the norm and supported by leadership.",
        "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?"
      },
      "optionB": {
        "label": "Collaboration is difficult due to silos/politics/unclear expectations.",
        "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-REI-AFC1"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement about working execution seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "People feel valued and connected to the mission.",
        "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?"
      },
      "optionB": {
        "label": "People feel like execution matters more than people.",
        "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-REI-AFC2"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement about leadership communication seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "People experience leadership communication as consistent and credible.",
        "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?"
      },
      "optionB": {
        "label": "People experience leadership communication as mixed or conflicting.",
        "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-REI-AFC3"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement about leadership listening and feedback seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "Leaders routinely listen and act on what they hear.",
        "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?"
      },
      "optionB": {
        "label": "Listening happens, but follow-through is inconsistent.",
        "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-REI-AFC4"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "We build trust through consistent leadership behaviour and follow-through.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-A1"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "Cross-team collaboration is expected and actively enabled by leaders and managers.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-A2"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "We address politics, misalignment, and conflict quickly and constructively.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-A3"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "People feel recognized and connected to purpose, not just tasks.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-A4"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "Leadership communication is clear, consistent, and aligned across leaders.",
    "scale": "SCALE_1_5",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-A5"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "We explain \u201cwhy\u201d behind decisions and the implications for teams.",
    "scale": "SCALE_1_5",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-A6"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "Leaders are visible and accessible enough to maintain trust and reduce uncertainty.",
    "scale": "SCALE_1_5",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-A7"
  },
  {
    "stakeholder": "admin",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "Communication is delivered with empathy and acknowledges real constraints on teams.",
    "scale": "SCALE_1_5",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-A8"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you try a new approach to improve your work?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-EB1"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did change or uncertainty reduce your confidence or motivation?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-EB2"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Calibration",
    "questionStem": "I can answer honestly about my comfort with change and learning.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-ECAL1"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Calibration",
    "questionStem": "I am happy with the pace of change in my workplace and supports in place to support me in the transitions.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-ECAL2"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement fits your experience with change?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "I understand what to do and feel supported to adapt.",
        "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?"
      },
      "optionB": {
        "label": "I\u2019m unsure what to do and feel left to figure it out on my own.",
        "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-MA-EFC1"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement fits your mindset about change?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "I see change as an opportunity to improve.",
        "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?"
      },
      "optionB": {
        "label": "I see change as disruptive and mostly negative.",
        "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-MA-EFC2"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionStem": "I\u2019m open to changing how I work when priorities or information change.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-E1"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionStem": "I can learn new skills or processes quickly enough to keep up with change.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-E2"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionStem": "Even when change is uncomfortable, I stay solution-focused and resilient.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What helps or hinders adaptability (learning support, clarity, confidence, resilience) in day-to-day work?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-E3"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you speak up about a concern or risk?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-EB1"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you feel overwhelmed or at risk of burnout?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-EB2"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Calibration",
    "questionStem": "I feel safe answering this assessment honestly without fear of consequences.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-ECAL1"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement is closer to your experience when workload is high?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "We discuss priorities and adjust expectations.",
        "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?"
      },
      "optionB": {
        "label": "I\u2019m expected to cope without changes or support.",
        "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-PHS-EFC1"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "I feel safe speaking up with questions, concerns, or sharing mistakes at work.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-E1"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "When I raise an issue, it is handled respectfully and fairly.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-E2"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "I have the support I need to protect my wellbeing and manage stress at work.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What conditions strengthen or weaken psychological health & safety (speaking up, respect, workload stress)?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-E3"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you receive clear, helpful communication from your team?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-EB1"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often were disagreements handled respectfully and constructively?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-EB2"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did your manager/leader check in on workload or wellbeing?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-EB3"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you receive coaching, guidance, or feedback that helped you improve?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-EB4"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Calibration",
    "questionStem": "I can be candid about team dynamics and relationships without worry.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-ECAL1"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Calibration",
    "questionStem": "I can be honest about leadership support without worry.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-ECAL2"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement is closer to your team\u2019s reality?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "We address tensions early and resolve issues respectfully.",
        "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?"
      },
      "optionB": {
        "label": "Tensions linger and problems are avoided or handled indirectly.",
        "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-REI-EFC1"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement is closer to your feedback experience?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "Feedback helps me improve and is delivered respectfully.",
        "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?"
      },
      "optionB": {
        "label": "Feedback feels unclear, harsh, or is rarely given.",
        "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-REI-EFC2"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement best matches your experience with leadership support?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "My leader helps remove barriers so I can do my job well.",
        "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?"
      },
      "optionB": {
        "label": "Barriers remain and I\u2019m expected to manage them on my own.",
        "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-REI-EFC3"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement best matches your experience of recognition and respect?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "Effort and contributions are noticed and acknowledged.",
        "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?"
      },
      "optionB": {
        "label": "Effort and contributions often go unnoticed.",
        "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-REI-EFC4"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "People on my team communicate openly and listen to understand.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-E1"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "I can raise concerns directly with colleagues without conflict escalating.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-E2"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "I feel trusted and included by the people I work with.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-E3"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "My manager/leader shows genuine care for people, not just results.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-E4"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "My manager/leader is approachable and responds constructively when concerns are raised.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-E5"
  },
  {
    "stakeholder": "employee",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "I receive recognition and support that helps me stay engaged and motivated to perform well.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are relationships strongest/weakest (trust, communication, conflict, feedback) and what would improve them?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-E6"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you remove a structural barrier slowing learning/adoption?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-LB1"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you re-prioritize to focus on highest-value outcomes?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-LB2"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you sponsor capability-building (training/coaching)?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-LB3"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Calibration",
    "questionStem": "I can be candid about our organization\u2019s ability to learn and adapt at pace.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-LCAL1"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionStem": "We invest in the skills and learning required for our future strategy (not just today\u2019s needs).",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-L1"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionStem": "We adapt strategy and priorities quickly when conditions change.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-L2"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionStem": "We remove barriers so teams can experiment, learn, and improve ways of working.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-L3"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionStem": "We reinforce change with follow-through (practice, measurement, recognition).",
    "scale": "SCALE_1_5",
    "insightPrompt": "What limits adaptability (capability, clarity, capacity, incentives, reinforcement) and where should we focus first?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-L4"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you address a behaviour/practice that reduced psychological safety?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-LB1"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you sponsor actions to reduce workload/stress hotspots?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-LB2"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you seek unfiltered feedback from frontline teams?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-LB3"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "I model behaviours that make it safe to raise risks, concerns, and mistakes.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-L1"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "I hold others accountable for behaviours that undermine respect, inclusion, or safety.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-L2"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "Psychological safety and wellbeing are embedded in leadership expectations and performance.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-L3"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "We allocate time/resources to reduce workload pressure and burnout risk.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where in the organization is psychological safety weakest or most inconsistent, and what leadership behaviours influence this?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-L4"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you intervene to remove cross-team friction?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-LB1"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you recognize behaviours that strengthen collaboration and trust?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-LB2"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you address misalignment between leaders/teams?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-LB3"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you communicate a decision with clear rationale and impacts?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-LB4"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you engage directly with frontline teams to listen/respond?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-LB5"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you correct mixed messages or misalignment between leaders?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-LB6"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement about collaboration seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "Collaboration is the norm and supported by leadership.",
        "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?"
      },
      "optionB": {
        "label": "Collaboration is difficult due to silos/politics/unclear expectations.",
        "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-REI-LFC1"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement about working execution seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "People feel valued and connected to the mission.",
        "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?"
      },
      "optionB": {
        "label": "People feel like execution matters more than people.",
        "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-REI-LFC2"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement about leadership communication seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "People experience leadership communication as consistent and credible.",
        "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?"
      },
      "optionB": {
        "label": "People experience leadership communication as mixed or conflicting.",
        "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-REI-LFC3"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement about leadership listening and feedback seems most accurate to you?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "Leaders routinely listen and act on what they hear.",
        "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?"
      },
      "optionB": {
        "label": "Listening happens, but follow-through is inconsistent.",
        "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-REI-LFC4"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "We build trust through consistent leadership behaviour and follow-through.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-L1"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "Cross-team collaboration is expected and actively enabled by leaders and managers.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-L2"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "We address politics, misalignment, and conflict quickly and constructively.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-L3"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "People feel recognized and connected to purpose, not just tasks.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where are trust, collaboration, engagement, and cross-team relationships strong/weak\u2014and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-L4"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "Leadership communication is clear, consistent, and aligned across leaders.",
    "scale": "SCALE_1_5",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-L5"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "We explain \u201cwhy\u201d behind decisions and the implications for teams.",
    "scale": "SCALE_1_5",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-L6"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "Leaders are visible and accessible enough to maintain trust and reduce uncertainty.",
    "scale": "SCALE_1_5",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-L7"
  },
  {
    "stakeholder": "leader",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "Communication is delivered with empathy and acknowledges real constraints on teams.",
    "scale": "SCALE_1_5",
    "insightPrompt": "How consistent and credible is leadership communication (clarity, alignment, empathy, visibility) across the org?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-L8"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you provide coaching or practice opportunities to build new skills?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What\u2019s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-MB1"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you remove barriers so the team could adopt a new way of working?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "What\u2019s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-MB2"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Forced-Choice",
    "questionStem": "Which best reflects how change is introduced on your team?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "What\u2019s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "With support, practice, and follow-up.",
        "insightPrompt": "What\u2019s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?"
      },
      "optionB": {
        "label": "Announced and we move on without support.",
        "insightPrompt": "What\u2019s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-MA-MFC1"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Forced-Choice",
    "questionStem": "Which best reflects how setbacks are treated?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "What\u2019s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "As learning opportunities.",
        "insightPrompt": "What\u2019s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?"
      },
      "optionB": {
        "label": "As failures to avoid.",
        "insightPrompt": "What\u2019s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-MA-MFC2"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionStem": "I coach my team through change by focusing on learning, experimentation, and progress.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What\u2019s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-M1"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionStem": "I help team members build confidence when new expectations, tools, or processes are introduced.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What\u2019s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-M2"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Mindset & Adaptability",
    "questionType": "Self-Rating",
    "questionStem": "I model adaptability by adjusting plans and behaviours when conditions change.",
    "scale": "SCALE_1_5",
    "insightPrompt": "What\u2019s preventing stronger adaptability (skills, clarity, time, support, confidence) and what would help?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-MA-M3"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you invite dissenting views or bad news in team discussions?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-MB1"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you adjust priorities/capacity to protect wellbeing?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-MB2"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you address a fairness or inclusion issue directly?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-MB3"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you ensure quieter voices were included in decisions?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-MB4"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Calibration",
    "questionStem": "I can be honest about psychological safety on my team without fear of repercussions.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-MCAL1"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Calibration",
    "questionStem": "I feel confident in my ability to foster psychological safety and trust on my team.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-MCAL2"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement best matches your typical response to concerns?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "I respond with curiosity and action.",
        "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?"
      },
      "optionB": {
        "label": "I respond defensively or delay addressing it.",
        "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-PHS-MFC1"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Forced-Choice",
    "questionStem": "Which statement best matches your team\u2019s experience with mistakes?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "Mistakes are treated as learning without blame.",
        "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?"
      },
      "optionB": {
        "label": "Mistakes often trigger blame or embarrassment.",
        "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-PHS-MFC2"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Forced-Choice",
    "questionStem": "Which best reflects your team\u2019s experience?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "Decisions feel fair and transparent.",
        "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?"
      },
      "optionB": {
        "label": "Decisions feel inconsistent or influenced by politics.",
        "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-PHS-MFC3"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Forced-Choice",
    "questionStem": "Which best reflects how inclusion is experienced?",
    "scale": "FORCED_CHOICE",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "forcedChoice": {
      "optionA": {
        "label": "People feel they belong and can contribute fully.",
        "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?"
      },
      "optionB": {
        "label": "Some people feel excluded or overlooked.",
        "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?"
      },
      "higherValueOption": "A"
    },
    "questionCode": "PP-PHS-MFC4"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "I actively create an environment where team members can speak up without fear.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-M1"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "I address behaviours that undermine respect, inclusion, or psychological safety.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-M2"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "I monitor workload and stress signals and intervene before burnout escalates.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-M3"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "People on my team are treated fairly and respectfully, regardless of role or background.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-M4"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "I act quickly when I see exclusion, favoritism, or disrespect.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-M5"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Psychological Health & Safety",
    "questionType": "Self-Rating",
    "questionStem": "People feel safe raising concerns about fairness or inclusion.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where is psychological health & safety most at risk (speaking up, respect, stress) and why?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-PHS-M6"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you give timely, specific feedback that improved performance?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where does communication from you or within your team break down or create confusion?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-MB1"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Behavioural",
    "questionStem": "In the past 30 days, how often did you resolve a tension before it affected outcomes?",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where does communication from you or within your team break down or create confusion?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-MB2"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionStem": "I ensure that team understands the \u201cwhy\u201d behind decisions.",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where does communication from you or within your team break down or create confusion?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-MFC1"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Forced-Choice",
    "questionStem": "I address performance issues directly and respectfully.",
    "scale": "NEVER_ALWAYS",
    "insightPrompt": "Where does communication from you or within your team break down or create confusion?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-MFC2"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "I handle conflict and difficult conversations calmly and constructively.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where does communication from you or within your team break down or create confusion?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-M1"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "I build trust by following through consistently and listening with empathy.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where does communication from you or within your team break down or create confusion?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-M2"
  },
  {
    "stakeholder": "manager",
    "domain": "People Potential",
    "subdomain": "Relational & Emotional Intelligence",
    "questionType": "Self-Rating",
    "questionStem": "I encourage open dialogue and honest feedback across my team.",
    "scale": "SCALE_1_5",
    "insightPrompt": "Where does communication from you or within your team break down or create confusion?",
    "subdomainWeight": 0.35,
    "questionCode": "PP-REI-M3"
  }
];

const seedQuestions = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected.");

    console.log(`Starting to seed/update ${questions.length} questions...`);
    
    let count = 0;
    for (const qData of questions) {
        const existing = await Question.findOne({ questionCode: qData.questionCode });
        if (existing) {
            await Question.findByIdAndUpdate(existing._id, qData);
        } else {
            await Question.create(qData);
        }
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
