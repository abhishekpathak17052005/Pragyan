import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Briefcase, Globe, Code2, BarChart2, Cpu,
  ChevronRight, Search, Star, Users, ArrowRight, Sparkles, Target, BookOpen, Clock, Brain
} from "lucide-react";
import { CircularProgress } from "@/components/ui/circular-progress";
import { aiService } from "@/services/aiService";
import { csvCareerService } from "@/services/csvCareerService";
import { assessmentService } from "@/services/assessmentService";

const careerIcons: Record<string, typeof Code2> = {
  "Data Scientist": BarChart2,
  "AI/ML Engineer": Cpu,
  "Data Analyst": BarChart2,
  "Software Engineer": Code2,
  "Product Manager": Briefcase,
  "DevOps Engineer": Globe,
  "Frontend Developer": Code2,
  "Backend Developer": Code2,
};

const demandMap: Record<string, { text: string; color: string }> = {
  high: { text: "High", color: "text-green-600 bg-green-100" },
  medium: { text: "Medium", color: "text-amber-600 bg-amber-100" },
  low: { text: "Low", color: "text-red-600 bg-red-100" },
};

export default function CareerDiscovery() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const tabParam = urlParams.get('tab');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"adaptive" | "csv" | "ai">(
    (tabParam === "adaptive" || tabParam === "csv" || tabParam === "ai") ? tabParam : "csv"
  );

  // Read latest assessment ID from localStorage
  const [latestAssessmentId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('pragyan_latest_assessment_id');
    } catch {
      return null;
    }
  });

  // Fetch adaptive assessment result
  const { data: adaptiveResult, isLoading: isLoadingAdaptive } = useQuery({
    queryKey: ["assessment-result", latestAssessmentId],
    queryFn: () => latestAssessmentId ? assessmentService.getAdaptiveResult(latestAssessmentId) : null,
    enabled: !!latestAssessmentId && activeTab === "adaptive",
    retry: false,
  });

  // Fetch AI recommendations (old method)
  const { data: aiRecommendations = [], isLoading: isLoadingAI } = useQuery({
    queryKey: ["ai", "recommend-careers"],
    queryFn: aiService.getCareerRecommendations,
    retry: false,
    enabled: activeTab === "ai",
  });

  // Fetch CSV-based recommendations (new method)
  const { data: csvData, isLoading: isLoadingCSV } = useQuery({
    queryKey: ["csv-careers", "recommendations"],
    queryFn: () => csvCareerService.getRecommendations({ limit: 10 }),
    retry: false,
    enabled: activeTab === "csv",
  });

  const recommendations =
    activeTab === "adaptive" && adaptiveResult
      ? (adaptiveResult.topMatches || []).map((match) => ({
          career: match.career,
          score: Math.round(match.score ?? match.match ?? 0),
          reason: match.reasons?.[0]
            ?? (match.matchedSkills?.length
              ? `${match.matchedSkills.length} skills matched`
              : "Based on your adaptive assessment"),
          matchedSkills: match.matchedSkills ?? [],
          missingSkills: match.missingSkills ?? match.skillGaps ?? [],
          confidence:
            (adaptiveResult.confidence ?? 0) > 0.8
              ? "high"
              : (adaptiveResult.confidence ?? 0) > 0.6
              ? "medium"
              : "low",
          futureDemand: match.futureDemand,
          growthRate: match.growthRate,
          salaryRange: match.salaryRange,
        }))
      : activeTab === "csv"
      ? (csvData || []).map(match => ({
          career: match.careerTitle,
          score: Math.round(match.overallScore),
          reason: match.recommendationReason[0] || "Based on your assessment and skills",
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
          confidence: match.confidenceLevel,
          timeToReady: match.estimatedTimeToReady,
        }))
      : aiRecommendations;

  const isLoading = activeTab === "adaptive" 
    ? isLoadingAdaptive 
    : activeTab === "csv" 
    ? isLoadingCSV 
    : isLoadingAI;

  const filteredCareers = useMemo(() => {
    return recommendations
      .filter((rec) =>
        searchQuery === ""
          ? true
          : rec.career?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [recommendations, searchQuery]);

  const getCareerIcon = (career: string) => {
    const Icon = careerIcons[career] || Briefcase;
    return Icon;
  };

  const getDemand = (score: number): "high" | "medium" | "low" => {
    if (score >= 80) return "high";
    if (score >= 60) return "medium";
    return "low";
  };

  const getCareerSalary = (career: string): string => {
    const salaryRanges: Record<string, string> = {
      "Software Engineer": "₹8–18 LPA",
      "Data Scientist": "₹10–22 LPA",
      "AI/ML Engineer": "₹12–25 LPA",
      "Product Manager": "₹12–24 LPA",
      "DevOps Engineer": "₹10–20 LPA",
      "Cloud Architect": "₹14–28 LPA",
      "Frontend Developer": "₹8–16 LPA",
      "Backend Developer": "₹10–20 LPA",
    };
    return salaryRanges[career] || "₹8–20 LPA";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Career Discovery</h1>
          <p className="text-muted-foreground mt-1">Find careers that match your skills and interests.</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1">
          <Button
            variant={activeTab === "adaptive" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("adaptive")}
            className="rounded-lg gap-1.5"
          >
            <Brain className="w-3 h-3" />
            Adaptive Match
          </Button>
          <Button
            variant={activeTab === "csv" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("csv")}
            className="rounded-lg gap-1.5"
          >
            <Target className="w-3 h-3" />
            Assessment Match
          </Button>
          <Button
            variant={activeTab === "ai" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("ai")}
            className="rounded-lg gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            AI Match
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search careers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading career recommendations...</div>
      ) : activeTab === "adaptive" && !latestAssessmentId ? (
        <div className="bg-card border border-border rounded-[20px] p-12 shadow-sm text-center">
          <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Adaptive Assessment Yet</h3>
          <p className="text-muted-foreground mb-6">
            Complete the adaptive assessment to get personalized career recommendations based on your traits and preferences.
          </p>
          <Link href="/assessments">
            <Button className="rounded-full px-6">
              Start Adaptive Assessment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      ) : filteredCareers.length > 0 ? (
        <>
          {/* Confidence Banner for Adaptive Tab */}
          {activeTab === "adaptive" && adaptiveResult && (
            <div className="bg-gradient-to-r from-primary/10 to-blue-50 border border-primary/20 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Adaptive Assessment Results
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Based on {Math.round(adaptiveResult.confidence * 100)}% confidence • {adaptiveResult.topMatches.length} matches found
                    </p>
                  </div>
                </div>
                <Link href="/assessments">
                  <Button variant="outline" size="sm" className="rounded-full">
                    Retake Assessment
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
          {filteredCareers.map((rec, idx) => {
            const Icon = getCareerIcon(rec.career);
            const demand = getDemand(rec.score || 0);
            const salary = rec.salaryRange || getCareerSalary(rec.career);
            const isAdaptive = activeTab === "adaptive";
            const isCSV = activeTab === "csv";

            return (
              <div
                key={rec.career}
                className="bg-card border border-border rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-foreground">{rec.career}</h3>
                        {idx === 0 && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-semibold">
                            Top Match
                          </span>
                        )}
                        {isCSV && rec.confidence && (
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            rec.confidence === 'high' ? 'bg-green-100 text-green-700' :
                            rec.confidence === 'medium' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {rec.confidence} confidence
                          </span>
                        )}
                        {isAdaptive && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                            Adaptive Match
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{rec.reason || "Based on your profile and skills"}</p>

                      {/* Show matched/missing skills for CSV and Adaptive recommendations */}
                      {(isCSV || isAdaptive) && rec.matchedSkills && rec.matchedSkills.length > 0 && (
                        <div className="mb-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <Target className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-1">Your Skills Match:</p>
                              <div className="flex flex-wrap gap-1">
                                {rec.matchedSkills.slice(0, 5).map((skill) => (
                                  <span key={skill} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                                    {skill}
                                  </span>
                                ))}
                                {rec.matchedSkills.length > 5 && (
                                  <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-xs">
                                    +{rec.matchedSkills.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {rec.missingSkills && rec.missingSkills.length > 0 && (
                            <div className="flex items-start gap-2">
                              <BookOpen className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground mb-1">Skills to Learn:</p>
                                <div className="flex flex-wrap gap-1">
                                  {rec.missingSkills.slice(0, 5).map((skill) => (
                                    <span key={skill} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs">
                                      {skill}
                                    </span>
                                  ))}
                                  {rec.missingSkills.length > 5 && (
                                    <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-xs">
                                      +{rec.missingSkills.length - 5} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">AVERAGE SALARY</p>
                          <p className="text-lg font-semibold text-foreground">{salary}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">JOB DEMAND</p>
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${demandMap[demand].color}`}>
                            {demandMap[demand].text}
                          </span>
                        </div>
                        {isCSV && rec.timeToReady && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">TIME TO READY</p>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-blue-600" />
                              <p className="text-sm font-semibold text-blue-600">{rec.timeToReady}</p>
                            </div>
                          </div>
                        )}
                        {(isAdaptive || activeTab === "ai") && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">GROWTH RATE</p>
                            <p className="text-lg font-semibold text-green-600">{rec.growthRate || "+20%"}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4 flex-shrink-0">
                    <div className="flex flex-col items-center">
                      <CircularProgress
                        value={rec.score || 0}
                        size={80}
                        strokeWidth={6}
                        valueFormatter={(val) => `${val}%`}
                      />
                      <p className="text-xs text-muted-foreground mt-2 text-center">Match Score</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link href={`/journey/${rec.career.toLowerCase().replace(/\s+/g, "-")}`}>
                        <Button className="rounded-full px-6 flex items-center gap-2">
                          Explore
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                      {isCSV && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="rounded-full px-4"
                          onClick={() => {
                            // TODO: Show skill gap analysis modal
                            console.log('View skill gaps for', rec.career);
                          }}
                        >
                          View Skill Gap
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No careers found matching your search.</p>
          <Button
            variant="outline"
            onClick={() => setSearchQuery("")}
            className="rounded-xl"
          >
            Clear Search
          </Button>
        </div>
      )}

      {recommendations.length === 0 && !isLoading && (
        <div className="bg-card border border-border rounded-[20px] p-12 shadow-sm text-center">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Recommendations Yet</h3>
          <p className="text-muted-foreground mb-6">
            Complete your assessment to get personalized career recommendations.
          </p>
          <Link href="/assessments">
            <Button className="rounded-full px-6">
              Start Assessment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
