"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sparkles, Plus } from "lucide-react"
import { useFlowActions } from "../../hooks/useFlowActions"

export function Header() {
  const { triggerAddNode } = useFlowActions();
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <div className="mr-6 flex">
          <Link className="flex items-center space-x-3" href="/">
            <Sparkles className="h-7 w-7 text-primary" />
            <span className="hidden font-bold text-lg sm:inline-block">
              AI Flow Builder
            </span>
          </Link>
        </div>
        
        {/* Center section with Create Node button */}
        <div className="flex-1 flex justify-center">
          <Button
            onClick={triggerAddNode}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Node
          </Button>
        </div>
        
        <div className="flex items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="text-sm">
              Documentation
            </Button>
            <Button variant="ghost" size="sm" className="text-sm">
              Templates
            </Button>
            <div className="mx-2">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
