import { PersonaType, CareerStage } from './DiscoveryProfile';

interface UserAnswers {
  situation: string;
  activity: string;
  learningStyle: string;
  time: string;
  experience: number;
  interests: string[];
}

export class PersonaRuleEngine {
  public static classify(answers: UserAnswers): { persona: PersonaType; confidence: number; stage: CareerStage } {
    const scores: Record<PersonaType, number> = {
      Explorer: 0,
      Confused: 0,
      'Goal-Oriented': 0,
      'Placement Aspirant': 0,
      'Career Switcher': 0,
      'Research Aspirant': 0,
      Freelancer: 0,
      Entrepreneur: 0,
    };

    switch (answers.situation) {
      case "I'm confused":
        scores.Confused += 40;
        break;
      case "I'm exploring careers":
        scores.Explorer += 40;
        break;
      case "I know my career goal":
        scores['Goal-Oriented'] += 40;
        break;
      case "I'm preparing for placements":
        scores['Placement Aspirant'] += 40;
        break;
      case "I want to switch careers":
        scores['Career Switcher'] += 40;
        break;
      case "I'm interested in research":
        scores['Research Aspirant'] += 40;
        break;
      case "I want to freelance":
        scores.Freelancer += 40;
        break;
      case "I want to build a startup":
        scores.Entrepreneur += 40;
        break;
    }

    switch (answers.activity) {
      case 'Building apps':
        scores['Goal-Oriented'] += 10;
        scores.Entrepreneur += 10;
        break;
      case 'Breaking systems':
        scores['Placement Aspirant'] += 10;
        break;
      case 'Designing interfaces':
        scores.Freelancer += 10;
        break;
      case 'Researching':
        scores['Research Aspirant'] += 20;
        break;
      case 'Managing teams':
        scores.Entrepreneur += 20;
        break;
      case 'Analysing data':
        scores['Research Aspirant'] += 10;
        scores['Goal-Oriented'] += 5;
        break;
      case 'Creating videos':
        scores.Freelancer += 10;
        break;
      case 'Teaching people':
        scores.Freelancer += 10;
        scores['Placement Aspirant'] += 5;
        break;
    }

    let stage: CareerStage = 'Beginner';
    if (answers.experience > 5) stage = 'Advanced';
    else if (answers.experience >= 2) stage = 'Intermediate';

    let topPersona: PersonaType = 'Explorer';
    let maxScore = -1;

    for (const persona in scores) {
      const score = scores[persona as PersonaType];
      if (score > maxScore) {
        maxScore = score;
        topPersona = persona as PersonaType;
      }
    }

    const confidence = Math.min(95, Math.max(70, maxScore + answers.interests.length * 2));

    return {
      persona: topPersona,
      confidence,
      stage,
    };
  }
}
