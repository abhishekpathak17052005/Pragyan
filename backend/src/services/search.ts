import { prisma } from '@/lib/prisma';
import { careerCatalog } from '@/data/careerCatalog';

export type SearchResultType = 'career' | 'roadmap' | 'resource';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  route: string;
}

function matchesQuery(value: string, query: string) {
  return value.toLocaleLowerCase().includes(query);
}

export class SearchService {
  async search(rawQuery: string, limit = 20) {
    const query = rawQuery.trim().toLocaleLowerCase();
    const catalogResults: SearchResult[] = careerCatalog
      .filter((career) => matchesQuery([
        career.role,
        career.category,
        career.requiredSkills.join(' '),
        career.keywords.join(' '),
      ].join(' '), query))
      .map((career) => ({
        id: `catalog-career-${career.slug}`,
        type: 'career' as const,
        title: career.role,
        description: `${career.category} career · Skills: ${career.requiredSkills.slice(0, 3).join(', ')}`,
        route: `/career-discovery?career=${encodeURIComponent(career.slug)}`,
      }));

    const [roadmaps, resources] = await Promise.all([
      prisma.roadmap.findMany({
        where: {
          OR: [
            { title: { contains: rawQuery } },
            { description: { contains: rawQuery } },
            { category: { contains: rawQuery } },
            { tags: { has: rawQuery } },
          ],
        },
        select: { id: true, title: true, description: true, category: true },
        take: limit,
      }),
      prisma.learningResource.findMany({
        where: {
          OR: [
            { title: { contains: rawQuery } },
            { description: { contains: rawQuery } },
            { skill: { contains: rawQuery } },
            { topic: { contains: rawQuery } },
            { tags: { has: rawQuery } },
          ],
        },
        select: { id: true, title: true, description: true, topic: true },
        take: limit,
      }),
    ]);

    const databaseResults: SearchResult[] = [
      ...roadmaps.map((roadmap) => ({
        id: roadmap.id,
        type: 'roadmap' as const,
        title: roadmap.title,
        description: roadmap.description || roadmap.category,
        route: `/roadmap?roadmapId=${encodeURIComponent(roadmap.id)}`,
      })),
      ...resources.map((resource) => ({
        id: resource.id,
        type: 'resource' as const,
        title: resource.title,
        description: resource.description || resource.topic,
        route: `/resources?query=${encodeURIComponent(resource.topic)}`,
      })),
    ];

    const unique = new Map<string, SearchResult>();
    [...catalogResults, ...databaseResults].forEach((result) => unique.set(`${result.type}:${result.id}`, result));
    return Array.from(unique.values()).slice(0, limit);
  }
}

export const searchService = new SearchService();
