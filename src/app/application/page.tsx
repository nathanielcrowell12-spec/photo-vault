'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Camera, 
  Users, 
  Image as ImageIcon,
  ExternalLink,
  Plus,
  Search,
  Filter,
  Download,
  Share2
} from "lucide-react";

export default function Application() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <Camera className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">PhotoVault Hub</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
            Starter Kit
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to PhotoVault Hub</h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
            Your centralized dashboard for managing photography collections across multiple professional platforms.
          </p>
        </div>

        {/* Connected Platforms */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Connected Photography Platforms</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: "Pixieset", status: "pending", photos: 0 },
              { name: "Pic-Time", status: "pending", photos: 0 },
              { name: "CloudSpot", status: "pending", photos: 0 },
              { name: "ShootProof", status: "pending", photos: 0 },
              { name: "SmugMug", status: "pending", photos: 0 }
            ].map((platform, index) => (
              <HoverCard key={index}>
                <HoverCardTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold mb-1">{platform.name}</h3>
                      <Badge 
                        variant={platform.status === "connected" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {platform.status}
                      </Badge>
                      {platform.status === "connected" && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {platform.photos} photos
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </HoverCardTrigger>
                <HoverCardContent className="w-96">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="https://koqqkpitepqwlfjymcje.supabase.co/storage/v1/object/public/brand-assets/5ds-blank.svg" />
                        <AvatarFallback>5DS</AvatarFallback>
                      </Avatar>
                      <h4 className="text-sm font-semibold">Connect {platform.name} API</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Integrate {platform.name} with PhotoVault Hub to automatically sync your photo collections.
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-xs font-mono">
                      <div className="text-slate-600 dark:text-slate-400 mb-2">Claude Code Prompt (copy & paste):</div>
                      <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                        {`Add ${platform.name.toUpperCase()}_API_KEY=your-api-key-here to .env.local and create API integration for PhotoVault Hub. Build connection interface at /api/platforms/${platform.name.toLowerCase()} that fetches photo galleries and displays them in the dashboard. Use existing shadcn/ui card components for photo grid layout. After completing all tasks from this prompt, provide a 1-line feedback summary to Cursor Chat about what was accomplished.`}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full" 
                      onClick={() => navigator.clipboard.writeText(`Add ${platform.name.toUpperCase()}_API_KEY=your-api-key-here to .env.local and create API integration for PhotoVault Hub. Build connection interface at /api/platforms/${platform.name.toLowerCase()} that fetches photo galleries and displays them in the dashboard. Use existing shadcn/ui card components for photo grid layout. After completing all tasks from this prompt, provide a 1-line feedback summary to Cursor Chat about what was accomplished.`)}
                    >
                      Copy Claude Code Prompt
                    </Button>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        </div>

        {/* Recent Photo Sessions */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Photo Sessions</h2>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Platform
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center py-12 text-gray-500">
              <Camera className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No photo sessions found</p>
              <p className="text-sm">Connect your photography platforms to see sessions here</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for managing your photo collections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Search className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                      <h3 className="font-semibold mb-1">Search Photos</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Find photos across all platforms
                      </p>
                    </CardContent>
                  </Card>
                </HoverCardTrigger>
                <HoverCardContent className="w-96">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="https://koqqkpitepqwlfjymcje.supabase.co/storage/v1/object/public/brand-assets/5ds-blank.svg" />
                        <AvatarFallback>5DS</AvatarFallback>
                      </Avatar>
                      <h4 className="text-sm font-semibold">AI Photo Search</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Add intelligent photo search across all connected platforms using AI image recognition.
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-xs font-mono">
                      <div className="text-slate-600 dark:text-slate-400 mb-2">Claude Code Prompt (copy & paste):</div>
                      <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                        {`Add AI-powered photo search to PhotoVault Hub. Create search interface at /search with image recognition using OpenAI Vision API. Add OPENAI_API_KEY=your-api-key-here to .env.local. Build search results grid using shadcn/ui card components. Integrate with existing platform connections to search across all galleries. After completing all tasks from this prompt, provide a 1-line feedback summary to Cursor Chat about what was accomplished.`}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full" 
                      onClick={() => navigator.clipboard.writeText(`Add AI-powered photo search to PhotoVault Hub. Create search interface at /search with image recognition using OpenAI Vision API. Add OPENAI_API_KEY=your-api-key-here to .env.local. Build search results grid using shadcn/ui card components. Integrate with existing platform connections to search across all galleries. After completing all tasks from this prompt, provide a 1-line feedback summary to Cursor Chat about what was accomplished.`)}
                    >
                      Copy Claude Code Prompt
                    </Button>
                  </div>
                </HoverCardContent>
              </HoverCard>

              <HoverCard>
                <HoverCardTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Filter className="h-8 w-8 mx-auto mb-3 text-green-600" />
                      <h3 className="font-semibold mb-1">Filter Collections</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Organize by date, photographer, event
                      </p>
                    </CardContent>
                  </Card>
                </HoverCardTrigger>
                <HoverCardContent className="w-96">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="https://koqqkpitepqwlfjymcje.supabase.co/storage/v1/object/public/brand-assets/5ds-blank.svg" />
                        <AvatarFallback>5DS</AvatarFallback>
                      </Avatar>
                      <h4 className="text-sm font-semibold">Smart Filtering</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Add advanced filtering and categorization system for photo collections.
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-xs font-mono">
                      <div className="text-slate-600 dark:text-slate-400 mb-2">Claude Code Prompt (copy & paste):</div>
                      <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                        {`Add smart filtering system to PhotoVault Hub. Create filter interface with date ranges, photographer selection, and event categories. Build filter state management and apply to photo grid display. Use shadcn/ui select and date picker components. Add URL query parameters for shareable filtered views. After completing all tasks from this prompt, provide a 1-line feedback summary to Cursor Chat about what was accomplished.`}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full" 
                      onClick={() => navigator.clipboard.writeText(`Add smart filtering system to PhotoVault Hub. Create filter interface with date ranges, photographer selection, and event categories. Build filter state management and apply to photo grid display. Use shadcn/ui select and date picker components. Add URL query parameters for shareable filtered views. After completing all tasks from this prompt, provide a 1-line feedback summary to Cursor Chat about what was accomplished.`)}
                    >
                      Copy Claude Code Prompt
                    </Button>
                  </div>
                </HoverCardContent>
              </HoverCard>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Download className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                  <h3 className="font-semibold mb-1">Bulk Download</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Download multiple sessions at once
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Share2 className="h-8 w-8 mx-auto mb-3 text-orange-600" />
                  <h3 className="font-semibold mb-1">Share Collections</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Create shareable links for clients
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">-</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Connected Platforms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">-</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Photos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Camera className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">-</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Photo Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <ExternalLink className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold">-</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Photographers</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
