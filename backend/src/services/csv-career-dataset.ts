import fs from 'fs';
import path from 'path';

/**
 * Simple CSV parser - parses CSV content and returns records as objects
 */
function parseCSV(content: string, options: { columns: boolean; skip_empty_lines: boolean; trim: boolean }): Record<string, string>[] {
  const lines = content.split('\n').filter(line => !options.skip_empty_lines || line.trim().length > 0);
  if (lines.length === 0) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim());
  
  const records: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || (options.skip_empty_lines && !line.trim())) continue;
    
    const values = line.split(',').map(v => options.trim ? v.trim() : v);
    const record: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    
    records.push(record);
  }
  
  return records;
}

/**
 * Represents a career role from the CSV dataset
 */
export interface CSVCareerRole {
  candidateId: string;
  name: string;
  age: number;
  education: string;
  skills: string[];
  interests: string[];
  recommendedCareer: string;
  recommendationScore: number;
}

/**
 * Service for loading and querying the AI-based Career Recommendation System CSV dataset
 */
class CSVCareerDatasetService {
  private careers: CSVCareerRole[] = [];
  private careerIndex: Map<string, CSVCareerRole[]> = new Map();
  private skillIndex: Map<string, Set<string>> = new Map(); // skill -> career titles
  private interestIndex: Map<string, Set<string>> = new Map(); // interest -> career titles
  private uniqueCareerTitles: Set<string> = new Set();
  private isLoaded = false;

  constructor() {
    this.loadDataset();
  }

  /**
   * Load and parse the CSV dataset
   */
  public loadDataset(): void {
    try {
      const csvPath = path.join(__dirname, '../../datasets/AI-based Career Recommendation System.csv');
      const fileContent = fs.readFileSync(csvPath, 'utf-8');

      const records = parseCSV(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      this.careers = records.map((record: any) => ({
        candidateId: record.CandidateID,
        name: record.Name,
        age: parseInt(record.Age, 10),
        education: record.Education,
        skills: this.parseDelimitedField(record.Skills),
        interests: this.parseDelimitedField(record.Interests),
        recommendedCareer: record.Recommended_Career,
        recommendationScore: parseFloat(record.Recommendation_Score),
      }));

      // Build indexes for efficient lookup
      this.buildIndexes();
      this.isLoaded = true;

      console.log(`✓ CSV Career Dataset loaded: ${this.careers.length} records, ${this.uniqueCareerTitles.size} unique careers`);
    } catch (error) {
      console.error('Failed to load CSV career dataset:', error);
      this.isLoaded = false;
    }
  }

  /**
   * Parse semicolon-delimited fields from CSV
   */
  private parseDelimitedField(field: string): string[] {
    if (!field) return [];
    return field
      .split(';')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  /**
   * Build indexes for efficient career lookup by skills and interests
   */
  private buildIndexes(): void {
    this.careerIndex.clear();
    this.skillIndex.clear();
    this.interestIndex.clear();
    this.uniqueCareerTitles.clear();

    for (const career of this.careers) {
      // Index by career title
      const title = career.recommendedCareer;
      this.uniqueCareerTitles.add(title);

      if (!this.careerIndex.has(title)) {
        this.careerIndex.set(title, []);
      }
      this.careerIndex.get(title)!.push(career);

      // Index skills
      for (const skill of career.skills) {
        const normalizedSkill = skill.toLowerCase();
        if (!this.skillIndex.has(normalizedSkill)) {
          this.skillIndex.set(normalizedSkill, new Set());
        }
        this.skillIndex.get(normalizedSkill)!.add(title);
      }

      // Index interests
      for (const interest of career.interests) {
        const normalizedInterest = interest.toLowerCase();
        if (!this.interestIndex.has(normalizedInterest)) {
          this.interestIndex.set(normalizedInterest, new Set());
        }
        this.interestIndex.get(normalizedInterest)!.add(title);
      }
    }
  }

  /**
   * Get all unique career titles from the dataset
   */
  getUniqueCareerTitles(): string[] {
    return Array.from(this.uniqueCareerTitles);
  }

  /**
   * Get all career examples for a specific career title
   */
  getCareerExamples(careerTitle: string): CSVCareerRole[] {
    return this.careerIndex.get(careerTitle) || [];
  }

  /**
   * Get aggregated skills for a career title
   */
  getCareerSkills(careerTitle: string): string[] {
    const examples = this.getCareerExamples(careerTitle);
    const skillSet = new Set<string>();

    for (const example of examples) {
      for (const skill of example.skills) {
        skillSet.add(skill);
      }
    }

    return Array.from(skillSet);
  }

  /**
   * Get aggregated interests for a career title
   */
  getCareerInterests(careerTitle: string): string[] {
    const examples = this.getCareerExamples(careerTitle);
    const interestSet = new Set<string>();

    for (const example of examples) {
      for (const interest of example.interests) {
        interestSet.add(interest);
      }
    }

    return Array.from(interestSet);
  }

  /**
   * Get average recommendation score for a career title
   */
  getCareerAverageScore(careerTitle: string): number {
    const examples = this.getCareerExamples(careerTitle);
    if (examples.length === 0) return 0;

    const sum = examples.reduce((acc, ex) => acc + ex.recommendationScore, 0);
    return sum / examples.length;
  }

  /**
   * Find careers by skill match
   */
  findCareersBySkills(userSkills: string[]): Map<string, number> {
    const careerScores = new Map<string, number>();

    for (const skill of userSkills) {
      const normalizedSkill = skill.toLowerCase();
      const matchingCareers = this.skillIndex.get(normalizedSkill);

      if (matchingCareers) {
        for (const career of matchingCareers) {
          careerScores.set(career, (careerScores.get(career) || 0) + 1);
        }
      }

      // Partial matching for compound skills
      for (const [indexedSkill, careers] of this.skillIndex.entries()) {
        if (indexedSkill.includes(normalizedSkill) || normalizedSkill.includes(indexedSkill)) {
          for (const career of careers) {
            careerScores.set(career, (careerScores.get(career) || 0) + 0.5);
          }
        }
      }
    }

    return careerScores;
  }

  /**
   * Find careers by interest match
   */
  findCareersByInterests(userInterests: string[]): Map<string, number> {
    const careerScores = new Map<string, number>();

    for (const interest of userInterests) {
      const normalizedInterest = interest.toLowerCase();
      const matchingCareers = this.interestIndex.get(normalizedInterest);

      if (matchingCareers) {
        for (const career of matchingCareers) {
          careerScores.set(career, (careerScores.get(career) || 0) + 1);
        }
      }

      // Partial matching
      for (const [indexedInterest, careers] of this.interestIndex.entries()) {
        if (indexedInterest.includes(normalizedInterest) || normalizedInterest.includes(indexedInterest)) {
          for (const career of careers) {
            careerScores.set(career, (careerScores.get(career) || 0) + 0.5);
          }
        }
      }
    }

    return careerScores;
  }

  /**
   * Calculate education level score (0-1)
   */
  calculateEducationMatch(userEducation: string, careerTitle: string): number {
    const examples = this.getCareerExamples(careerTitle);
    if (examples.length === 0) return 0.5;

    const userLevel = this.normalizeEducationLevel(userEducation);
    let matchCount = 0;

    for (const example of examples) {
      const careerLevel = this.normalizeEducationLevel(example.education);
      if (userLevel >= careerLevel) {
        matchCount++;
      }
    }

    return matchCount / examples.length;
  }

  /**
   * Normalize education level to a numeric scale
   */
  private normalizeEducationLevel(education: string): number {
    const normalized = education.toLowerCase();

    if (normalized.includes('phd') || normalized.includes('doctorate')) return 4;
    if (normalized.includes('master')) return 3;
    if (normalized.includes('bachelor')) return 2;
    if (normalized.includes('diploma') || normalized.includes('associate')) return 1;
    return 0; // High school or below
  }

  /**
   * Check if dataset is loaded
   */
  isDatasetLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Get dataset statistics
   */
  getStatistics() {
    return {
      totalRecords: this.careers.length,
      uniqueCareers: this.uniqueCareerTitles.size,
      totalSkills: this.skillIndex.size,
      totalInterests: this.interestIndex.size,
      loaded: this.isLoaded,
    };
  }

  getDatasetStats() {
    return this.getStatistics();
  }

  /**
   * Get all records (for analysis purposes)
   */
  getAllRecords(): CSVCareerRole[] {
    return [...this.careers];
  }

  /**
   * Search careers with combined skill and interest matching
   */
  searchCareers(userSkills: string[], userInterests: string[]): Array<{
    careerTitle: string;
    skillMatchScore: number;
    interestMatchScore: number;
    totalScore: number;
    averageRecommendationScore: number;
  }> {
    const skillMatches = this.findCareersBySkills(userSkills);
    const interestMatches = this.findCareersByInterests(userInterests);

    const combinedScores = new Map<string, { skills: number; interests: number }>();

    // Combine skill scores
    for (const [career, score] of skillMatches.entries()) {
      if (!combinedScores.has(career)) {
        combinedScores.set(career, { skills: 0, interests: 0 });
      }
      combinedScores.get(career)!.skills = score;
    }

    // Combine interest scores
    for (const [career, score] of interestMatches.entries()) {
      if (!combinedScores.has(career)) {
        combinedScores.set(career, { skills: 0, interests: 0 });
      }
      combinedScores.get(career)!.interests = score;
    }

    // Calculate total scores and sort
    const results = Array.from(combinedScores.entries()).map(([careerTitle, scores]) => {
      const skillMatchScore = scores.skills;
      const interestMatchScore = scores.interests;
      const totalScore = skillMatchScore * 0.6 + interestMatchScore * 0.4; // Weight skills higher

      return {
        careerTitle,
        skillMatchScore,
        interestMatchScore,
        totalScore,
        averageRecommendationScore: this.getCareerAverageScore(careerTitle),
      };
    });

    return results.sort((a, b) => b.totalScore - a.totalScore);
  }
}

// Singleton instance
export const csvCareerDatasetService = new CSVCareerDatasetService();
