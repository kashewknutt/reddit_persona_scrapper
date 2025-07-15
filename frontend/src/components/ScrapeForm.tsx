'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, RefreshCcw, Download, User, BarChart3, MessageCircle, FileText, Eye, EyeOff, User2, CloudLightningIcon, Target, Heart } from 'lucide-react'
import Image from 'next/image'

interface ScrapeResult {
  username: string
  name: string | null
  profile_picture: string
  snoovatar: string
  occupation: string | null
  status: string | null
  location: string | null
  comment_karma: number
  post_karma: number
  total_karma: number
  created_utc: number
  is_mod: boolean
  is_gold: boolean
  verified: boolean
  has_verified_email: boolean
  accept_chats: boolean | null
  accept_pms: boolean | null
  accept_followers: boolean
  posts: {
    type: string
    title: string
    body: string
    subreddit: string
    created_utc: number
    url: string
  }[]
  comments: {
    type: string
    title: string
    body: string
    subreddit: string
    created_utc: number
    url: string
  }[]
}

interface TextWithUrl {
    text: string | null
    url: string | null
}

interface PersonaResult {
  username: string
  name: string | null
  profile_picture: string
  snoovatar: string
  occupation: string | null
  status: string | null
  location: string | null
  comment_karma: number
  post_karma: number
  total_karma: number
  created_utc: number
  is_mod: boolean
  is_gold: boolean
  verified: boolean
  has_verified_email: boolean
  accept_chats: boolean | null
  accept_pms: boolean | null
  accept_followers: boolean
  introversion_extroversion: number
  intuition_sensing: number
  feeling_thinking: number
  perceiving_judging: number
  behaviors_and_habits: TextWithUrl[]
  goals_and_needs: TextWithUrl[]
  frustrations: TextWithUrl[]
  motivations: TextWithUrl[]
  keywords: string[]
  personality_type: string | null
  emotional_regulation: string | null
}

interface HistoryItem {
  username: string
  scrapeResult: ScrapeResult
  personaResult: PersonaResult
  timestamp: number
}

const Toast = ({ message }: { message: string }) => (
  <div className="fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
    {message}
  </div>
)

const LoadingSteps = ({ stage }: { stage: 'scraping' | 'analyzing' }) => {
  const [currentStep, setCurrentStep] = useState(0)
  
  const scrapingSteps = [
    "Connecting to Reddit...",
    "Fetching user profile...",
    "Collecting posts and comments...",
    "Processing user data...",
    "Analyzing activity patterns..."
  ]
  
  const analyzingSteps = [
    "Initializing AI analysis...",
    "Understanding communication patterns...",
    "Identifying personality traits...",
    "Extracting behavioral insights...",
    "Generating comprehensive persona..."
  ]
  
  const steps = stage === 'scraping' ? scrapingSteps : analyzingSteps
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [steps.length])
  
  return (
    <div className="space-y-3">
      {steps.map((step, idx) => (
        <div key={idx} className={`flex items-center gap-3 ${idx === currentStep ? 'text-emerald-400' : 'text-slate-500'}`}>
          <div className={`w-2 h-2 rounded-full ${idx === currentStep ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          <span className="text-sm">{step}</span>
        </div>
      ))}
    </div>
  )
}

export default function ScrapeForm() {
  const [username, setUsername] = useState('')
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null)
  const [personaResult, setPersonaResult] = useState<PersonaResult | null>(null)
  const [loadingStage, setLoadingStage] = useState<'idle' | 'scraping' | 'analyzing'>('idle')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showRawData, setShowRawData] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('reddit-persona-history')
    if (saved) setHistory(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('reddit-persona-history', JSON.stringify(history))
  }, [history])

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  const handleScrape = async () => {
    if (!username) return
    setLoadingStage('scraping')

    try {
      const scrapeRes = await fetch('https://reddit-persona-scrapper.onrender.com/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      const scrapeData: ScrapeResult = await scrapeRes.json()

      if (scrapeData.posts.length === 0 || scrapeData.comments.length === 0) {
        throw new Error('No data found for this username')
      }
      setScrapeResult(scrapeData)

      setLoadingStage('analyzing')

      const analyzeRes = await fetch('https://reddit-persona-scrapper.onrender.com/generate_persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scrapeData),
      })

      if (!analyzeRes.ok) {
        throw new Error('Persona generation failed')
      }

      const personaData = await analyzeRes.json()
      setPersonaResult(personaData)
      setToastMessage('Persona analysis complete!')

      const historyItem: HistoryItem = {
        username,
        scrapeResult: scrapeData,
        personaResult: personaData,
        timestamp: Date.now()
      }

      setHistory((prev) => [historyItem, ...prev.slice(0, 9)])
      setSelectedHistoryIndex(null)
    } catch (e) {
      console.error('Scraping failed:', e)
      setToastMessage('Failed to analyze persona')
      setScrapeResult(null)
        setPersonaResult(null)
    } finally {
      setLoadingStage('idle')
    }
  }

  const handleHistoryClick = (idx: number) => {
    const item = history[idx]
    setUsername(item.username)
    setScrapeResult(item.scrapeResult)
    setPersonaResult(item.personaResult)
    setSelectedHistoryIndex(idx)
  }

  const downloadPersona = (format: 'txt' | 'pdf') => {
    if (!personaResult) return

    const content = generatePersonaContent(personaResult)
    
    if (format === 'txt') {
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${personaResult.username}_persona.txt`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      // Create a properly formatted PDF-ready HTML
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${personaResult.username} - Reddit Persona Analysis</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body {
                  font-family: 'Inter', sans-serif;
                  line-height: 1.6;
                  color: #1e293b;
                  background: white;
                  padding: 40px;
                  max-width: 800px;
                  margin: 0 auto;
                }
                
                .header {
                  text-align: center;
                  margin-bottom: 40px;
                  padding-bottom: 20px;
                  border-bottom: 2px solid #10b981;
                }
                
                .title {
                  font-size: 28px;
                  font-weight: 700;
                  color: #10b981;
                  margin-bottom: 8px;
                }
                
                .subtitle {
                  font-size: 16px;
                  color: #64748b;
                  margin-bottom: 20px;
                }
                
                .profile-info {
                  display: flex;
                  align-items: center;
                  gap: 20px;
                  margin-bottom: 30px;
                }
                
                .profile-pic {
                  width: 80px;
                  height: 80px;
                  border-radius: 50%;
                  border: 3px solid #10b981;
                }
                
                .section {
                  margin-bottom: 30px;
                }
                
                .section-title {
                  font-size: 20px;
                  font-weight: 600;
                  color: #10b981;
                  margin-bottom: 15px;
                  padding-bottom: 8px;
                  border-bottom: 1px solid #e2e8f0;
                }
                
                .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                  gap: 20px;
                  margin-bottom: 20px;
                }
                
                .stat-card {
                  background: #f8fafc;
                  padding: 20px;
                  border-radius: 8px;
                  border-left: 4px solid #10b981;
                }
                
                .stat-value {
                  font-size: 24px;
                  font-weight: 700;
                  color: #10b981;
                }
                
                .stat-label {
                  font-size: 14px;
                  color: #64748b;
                }
                
                .trait-bar {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  margin-bottom: 15px;
                }
                
                .trait-name {
                  font-weight: 500;
                  flex: 1;
                }
                
                .trait-score {
                  font-weight: 600;
                  color: #10b981;
                  margin-left: 10px;
                }
                
                .trait-progress {
                  width: 100px;
                  height: 8px;
                  background: #e2e8f0;
                  border-radius: 4px;
                  overflow: hidden;
                  margin-left: 20px;
                }
                
                .trait-fill {
                  height: 100%;
                  background: linear-gradient(90deg, #10b981, #065f46);
                  transition: width 0.3s ease;
                }
                
                .list-item {
                  background: #f8fafc;
                  padding: 15px;
                  margin-bottom: 10px;
                  border-radius: 6px;
                  border-left: 3px solid #10b981;
                }
                
                .keywords {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 8px;
                }
                
                .keyword {
                  background: #10b981;
                  color: white;
                  padding: 6px 12px;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: 500;
                }
                
                .footer {
                  margin-top: 40px;
                  text-align: center;
                  font-size: 12px;
                  color: #64748b;
                  border-top: 1px solid #e2e8f0;
                  padding-top: 20px;
                }
                
                @media print {
                  body { padding: 20px; }
                  .header { margin-bottom: 20px; }
                  .section { margin-bottom: 20px; }
                  .section { break-inside: avoid; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1 class="title">Reddit Persona Analysis</h1>
                <p class="subtitle">Generated on ${new Date().toLocaleDateString()}</p>
                <div class="profile-info">
                  <img src="${personaResult.profile_picture}" alt="Profile" class="profile-pic" />
                  <div>
                    <h2 style="font-size: 24px; font-weight: 600;">@${personaResult.username}</h2>
                    ${personaResult.name ? `<p style="color: #64748b;">${personaResult.name}</p>` : ''}
                    ${personaResult.occupation ? `<p style="color: #64748b; font-size: 14px;">${personaResult.occupation}</p>` : ''}
                  </div>
                </div>
              </div>
              
              <div class="section">
                <h3 class="section-title">Account Statistics</h3>
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-value">${personaResult.comment_karma.toLocaleString()}</div>
                    <div class="stat-label">Comment Karma</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${personaResult.post_karma.toLocaleString()}</div>
                    <div class="stat-label">Post Karma</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${personaResult.total_karma.toLocaleString()}</div>
                    <div class="stat-label">Total Karma</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${new Date(personaResult.created_utc * 1000).getFullYear()}</div>
                    <div class="stat-label">Joined Reddit</div>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <h3 class="section-title">Personality Traits</h3>
                <div class="trait-bar">
                  <span class="trait-name">Introversion/Extroversion</span>
                  <div class="trait-progress">
                    <div class="trait-fill" style="width: ${personaResult.introversion_extroversion * 10}%"></div>
                  </div>
                  <span class="trait-score">${personaResult.introversion_extroversion}/10</span>
                </div>
                <div class="trait-bar">
                  <span class="trait-name">Intuition/Sensing</span>
                  <div class="trait-progress">
                    <div class="trait-fill" style="width: ${personaResult.intuition_sensing * 10}%"></div>
                  </div>
                  <span class="trait-score">${personaResult.intuition_sensing}/10</span>
                </div>
                <div class="trait-bar">
                  <span class="trait-name">Feeling/Thinking</span>
                  <div class="trait-progress">
                    <div class="trait-fill" style="width: ${personaResult.feeling_thinking * 10}%"></div>
                  </div>
                  <span class="trait-score">${personaResult.feeling_thinking}/10</span>
                </div>
                <div class="trait-bar">
                  <span class="trait-name">Perceiving/Judging</span>
                  <div class="trait-progress">
                    <div class="trait-fill" style="width: ${personaResult.perceiving_judging * 10}%"></div>
                  </div>
                  <span class="trait-score">${personaResult.perceiving_judging}/10</span>
                </div>
              </div>
              
              <div class="section">
                <h3 class="section-title">Keywords</h3>
                <div class="keywords">
                  ${personaResult.keywords.map(keyword => `<span class="keyword">${keyword}</span>`).join('')}
                </div>
              </div>
              
              <div class="section">
                <h3 class="section-title">Behaviors & Habits</h3>
                ${personaResult.behaviors_and_habits.map(habit => `<div class="list-item">${habit.text}</div>`).join('')}
              </div>
              
              <div class="section">
                <h3 class="section-title">Goals & Needs</h3>
                ${personaResult.goals_and_needs.map(goal => `<div class="list-item">${goal.text}</div>`).join('')}
              </div>
              
              <div class="section">
                <h3 class="section-title">Frustrations</h3>
                ${personaResult.frustrations.map(frustration => `<div class="list-item">${frustration.text}</div>`).join('')}
              </div>
              
              <div class="section">
                <h3 class="section-title">Motivations</h3>
                ${personaResult.motivations.map(motivation => `<div class="list-item">${motivation.text}</div>`).join('')}
              </div>
              
              ${personaResult.personality_type ? `
              <div class="section">
                <h3 class="section-title">Personality Type</h3>
                <div class="list-item">${personaResult.personality_type}</div>
              </div>
              ` : ''}
              
              ${personaResult.emotional_regulation ? `
              <div class="section">
                <h3 class="section-title">Emotional Regulation</h3>
                <div class="list-item">${personaResult.emotional_regulation}</div>
              </div>
              ` : ''}
              
              <div class="footer">
                <p>Generated by Reddit Persona Profiler</p>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        setTimeout(() => printWindow.print(), 500)
      }
    }
  }

  const generatePersonaContent = (persona: PersonaResult) => {
    const date = new Date().toLocaleDateString()
    const createdDate = new Date(persona.created_utc * 1000).toLocaleDateString()
    
    return `REDDIT PERSONA ANALYSIS
Generated: ${date}
Username: @${persona.username}
${persona.name ? `Name: ${persona.name}` : ''}

PROFILE INFORMATION
===================
Occupation: ${persona.occupation || 'Not specified'}
Status: ${persona.status || 'Not specified'}
Location: ${persona.location || 'Not specified'}
Account Created: ${createdDate}

KARMA STATISTICS
================
Comment Karma: ${persona.comment_karma.toLocaleString()}
Post Karma: ${persona.post_karma.toLocaleString()}
Total Karma: ${persona.total_karma.toLocaleString()}

ACCOUNT STATUS
==============
Moderator: ${persona.is_mod ? 'Yes' : 'No'}
Gold Member: ${persona.is_gold ? 'Yes' : 'No'}
Verified: ${persona.verified ? 'Yes' : 'No'}
Verified Email: ${persona.has_verified_email ? 'Yes' : 'No'}
Accepts Followers: ${persona.accept_followers ? 'Yes' : 'No'}

PERSONALITY TRAITS
==================
Introversion/Extroversion: ${persona.introversion_extroversion}/10
Intuition/Sensing: ${persona.intuition_sensing}/10
Feeling/Thinking: ${persona.feeling_thinking}/10
Perceiving/Judging: ${persona.perceiving_judging}/10

BEHAVIORS & HABITS
==================
${persona.behaviors_and_habits.map((habit, i) => `${i + 1}. ${habit.text}`).join('\n')}

GOALS & NEEDS
=============
${persona.goals_and_needs.map((goal, i) => `${i + 1}. ${goal.text}`).join('\n')}

FRUSTRATIONS
============
${persona.frustrations.map((frustration, i) => `${i + 1}. ${frustration.text}`).join('\n')}

MOTIVATIONS
===========
${persona.motivations.map((motivation, i) => `${i + 1}. ${motivation.text}`).join('\n')}

KEYWORDS
========
${persona.keywords.join(', ')}

${persona.personality_type ? `\nPERSONALITY TYPE: ${persona.personality_type}` : ''}
${persona.emotional_regulation ? `\nEMOTIONAL REGULATION: ${persona.emotional_regulation}` : ''}
`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className="bg-slate-50">
      {/* Fixed Header with Search */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50">
        <div className="container mx-auto px-6 py-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <h1 className="text-xl font-semibold text-slate-900">
              Reddit<span className="text-emerald-500">Profiler</span>
            </h1>
            <div className="flex flex-col lg:flex-row items-center gap-3 flex-1 max-w-xl">
              <a
              href="https://github.com/kashewknutt/reddit_persona_scrapper"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-2 border border-gray-300 rounded-lg transition duration-300 hover:bg-emerald-300/30 relative group"
              >
              <Image src="/github.svg" alt="GitHub" width={16} height={16} />
              <span className="text-sm text-gray-700">Star</span>
              <div className="w-8 h-4 bg-gray-300 text-white text-xs flex items-center justify-center rounded-full cursor-pointer group-hover:bg-gray-400">
                i
              </div>
              <div className="absolute bottom-[-80px] w-full left-1/2 transform -translate-x-1/2 bg-gray-700 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                It would mean a lot if you starred the repo on GitHub! Show your support!
              </div>
              </a>
              <div className="relative w-full">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Reddit username..."
                className="w-full px-4 py-2 pr-12 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
              />
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              <button
              onClick={handleScrape}
              disabled={!username || loadingStage !== 'idle'}
              className="w-full lg:w-auto px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm whitespace-nowrap"
              >
              {loadingStage === 'idle' ? 'Analyze Profile' : 'Processing...'}
              </button>
            </div>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 mt-64 lg:mt-24 pb-8">
        <div className="grid lg:grid-cols-6 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden sticky top-24">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-medium text-sm text-slate-900">History</h3>
                </div>
              </div>
              
              {history.length === 0 ? (
                <div className="text-center p-6">
                  <User className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No analyses yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {history.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleHistoryClick(idx)}
                      className={`w-full text-left p-3 transition-colors ${
                        selectedHistoryIndex === idx
                          ? 'bg-emerald-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-slate-900">@{item.username}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {formatDate(item.timestamp)}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-5 space-y-6">
              {/* Inital Banner State */}
                {!scrapeResult && !personaResult && loadingStage === 'idle' && (
                <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center">
                  <div className="max-w-3xl mx-auto text-center space-y-8 px-4">
                    <div className="space-y-4">
                      <h2 className="text-4xl font-bold text-slate-900">
                        Discover the <span className="text-emerald-500">Power</span> Behind Reddit Profiles
                      </h2>
                      <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Uncover personality traits, behavior patterns, and insights from any Reddit user&apos;s digital footprint.
                        Quick, easy, and enlightening.
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-slate-50 rounded-2xl p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                            <User2 className="w-6 h-6 text-emerald-500" />
                          </div>
                          <h3 className="font-semibold text-slate-900">Enter Username</h3>
                          <p className="text-sm text-slate-600">Just paste any Reddit username above</p>
                        </div>
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                            <CloudLightningIcon className="w-6 h-6 text-emerald-500" />
                          </div>
                          <h3 className="font-semibold text-slate-900">Quick Analysis</h3>
                          <p className="text-sm text-slate-600">Takes less than 60 seconds</p>
                        </div>
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                            <Target className="w-6 h-6 text-emerald-500" />
                          </div>
                          <h3 className="font-semibold text-slate-900">Get Insights</h3>
                          <p className="text-sm text-slate-600">View detailed personality analysis</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center space-y-4">
                        <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-slate-600 text-center sm:text-left">
                        <span className="flex items-center gap-1">
                          Created with <Heart className="w-4 h-4 text-rose-900" /> by
                        </span>
                        <a
                          href="https://github.com/kashewknutt"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          Rajat Disawal
                        </a>
                        </div>
                      <div className="text-xs text-slate-400">
                        Join thousands of users who&apos;ve discovered insights about Reddit profiles
                      </div> 
                    </div>
                  </div>
                </div>
                )}
            {/* Loading State */}
            {loadingStage !== 'idle' && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <h3 className="font-medium text-sm text-slate-900">
                    {loadingStage === 'scraping' ? 'Scraping Reddit Data' : 'Analyzing Profile'}
                  </h3>
                </div>
                <LoadingSteps stage={loadingStage} />
              </div>
            )}

            {/* Raw Data Toggle */}
            {scrapeResult && (
              <div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowRawData(!showRawData)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-white rounded transition-colors"
                  >
                    {showRawData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showRawData ? 'Hide Raw Data' : 'View Raw Data'}
                  </button>
                </div>
                {showRawData && (
                  <div className="mt-4 bg-slate-100 rounded-lg p-4 border border-slate-200 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap">
          {JSON.stringify(scrapeResult, null, 2)}
        </pre>
                  </div>
                )}
              </div>
            )}

            {/* Results Section */}
            {personaResult && (
              <div className="space-y-6">
                {/* Profile Card */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-full border-2 border-slate-200 flex">
                        <Image
                          fill
                          src={personaResult.profile_picture}
                          alt="Profile"
                        />
                      </div>
                      <div>
                        <h2 className="text-lg font-medium text-slate-900">@{personaResult.username}</h2>
                        {personaResult.name && <p className="text-sm text-slate-600">{personaResult.name}</p>}
                        {personaResult.occupation && (
                          <p className="text-sm text-slate-500 mt-0.5">{personaResult.occupation}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadPersona('txt')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-sm transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        TXT
                      </button>
                      <button
                        onClick={() => downloadPersona('pdf')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-sm transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        PDF
                      </button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y">
                    <div className="p-6 text-center">
                      <BarChart3 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                      <div className="text-2xl font-semibold text-slate-900">
                        {personaResult.comment_karma.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Comment Karma</div>
                    </div>
                    <div className="p-6 text-center">
                      <MessageCircle className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-semibold text-slate-900">
                        {personaResult.post_karma.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Post Karma</div>
                    </div>
                    <div className="p-6 text-center">
                      <Eye className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                      <div className="text-2xl font-semibold text-slate-900">
                        {personaResult.total_karma.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Total Karma</div>
                    </div>
                    <div className="p-6 text-center">
                      <User className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                      <div className="text-2xl font-semibold text-slate-900">
                        {new Date(personaResult.created_utc * 1000).getFullYear()}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Joined Reddit</div>
                    </div>
                  </div>
                </div>

                {/* Personality Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Personality Traits */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-sm font-medium text-slate-900 mb-4">Personality Traits</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Introversion/Extroversion</span>
                            <span className="text-sm font-medium text-slate-900">
                              {personaResult.introversion_extroversion}/10
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${personaResult.introversion_extroversion * 10}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Intuition/Sensing</span>
                            <span className="text-sm font-medium text-slate-900">
                              {personaResult.intuition_sensing}/10
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${personaResult.intuition_sensing * 10}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Feeling/Thinking</span>
                            <span className="text-sm font-medium text-slate-900">
                              {personaResult.feeling_thinking}/10
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div
                              className="bg-purple-500 h-1.5 rounded-full"
                              style={{ width: `${personaResult.feeling_thinking * 10}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Perceiving/Judging</span>
                            <span className="text-sm font-medium text-slate-900">
                              {personaResult.perceiving_judging}/10
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div
                              className="bg-orange-500 h-1.5 rounded-full"
                              style={{ width: `${personaResult.perceiving_judging * 10}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Keywords */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-sm font-medium text-slate-900 mb-4">Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {personaResult.keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Behaviors & Habits */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-sm font-medium text-slate-900 mb-4">Behaviors & Habits</h3>
                      <div className="space-y-2">
                        {personaResult.behaviors_and_habits.map((habit, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-slate-50 rounded text-sm text-slate-600 flex items-center justify-between"
                          >
                            <span>{habit.text}</span>
                            {habit.url && (
                              <a
                                href={habit.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-3 text-xs text-emerald-600 hover:underline whitespace-nowrap"
                              >
                                Source
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Goals & Needs */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-sm font-medium text-slate-900 mb-4">Goals & Needs</h3>
                      <div className="space-y-2">
                        {personaResult.goals_and_needs.map((goal, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-slate-50 rounded text-sm text-slate-600"
                          >
                            <span>{goal.text}</span>
                            {goal.url && (
                              <a
                                href={goal.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-3 text-xs text-emerald-600 hover:underline whitespace-nowrap"
                              >
                                Source
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Frustrations */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-sm font-medium text-slate-900 mb-4">Frustrations</h3>
                      <div className="space-y-2">
                        {personaResult.frustrations.map((frustration, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-slate-50 rounded text-sm text-slate-600"
                          >
                            <span>{frustration.text}</span>
                            {frustration.url && (
                              <a
                                href={frustration.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-3 text-xs text-emerald-600 hover:underline whitespace-nowrap"
                              >
                                Source
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Motivations */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-sm font-medium text-slate-900 mb-4">Motivations</h3>
                      <div className="space-y-2">
                        {personaResult.motivations.map((motivation, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-slate-50 rounded text-sm text-slate-600"
                          >
                            <span>{motivation.text}</span>
                            {motivation.url && (
                              <a
                                href={motivation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-3 text-xs text-emerald-600 hover:underline whitespace-nowrap"
                              >
                                Source
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Personality Info */}
                {(personaResult.personality_type || personaResult.emotional_regulation) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {personaResult.personality_type && (
                      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <h3 className="text-sm font-medium text-slate-900 mb-4">Personality Type</h3>
                        <p className="text-sm text-slate-600">{personaResult.personality_type}</p>
                      </div>
                    )}
                    {personaResult.emotional_regulation && (
                      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <h3 className="text-sm font-medium text-slate-900 mb-4">Emotional Regulation</h3>
                        <p className="text-sm text-slate-600">{personaResult.emotional_regulation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {toastMessage && <Toast message={toastMessage} />}
    </div>
  )
}