import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/auth/logout-button';
import { getTags } from '@/lib/tags/queries';
import { TagBadge } from '@/components/tags/tag-badge';
import { getNotes } from '@/lib/notes/queries';
import { Button } from '@/components/ui/button';
import { SimpleNoteCard } from '@/components/notes/note-card';
import { Plus, FileText, ArrowRight, Tag, Sparkles } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const notes = await getNotes();
  const recentNotes = notes.slice(0, 3);
  const tags = await getTags();
  const recentTags = tags.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Smart Notes
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/notes">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                My Notes
              </Button>
            </Link>
            <Link href="/insights">
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Insights
              </Button>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back, {user?.email}!
          </p>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Notes
              </h3>
              <Link href="/notes">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            {recentNotes.length === 0 ? (
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h4 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No notes yet
                </h4>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Get started by creating your first note.
                </p>
                <div className="mt-4">
                  <Link href="/notes/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first note
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentNotes.map((note) => (
                  <SimpleNoteCard key={note.id} note={note} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Tags */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Tags
              </h3>
              <Link href="/tags">
                <Button variant="ghost" size="sm">
                  Manage tags
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            {recentTags.length === 0 ? (
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
                <Tag className="mx-auto h-12 w-12 text-gray-400" />
                <h4 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No tags yet
                </h4>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Create tags to organize your notes.
                </p>
                <div className="mt-4">
                  <Link href="/tags">
                    <Button>
                      <Tag className="h-4 w-4 mr-2" />
                      Create your first tag
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="flex flex-wrap gap-3">
                  {recentTags.map((tag) => (
                    <Link key={tag.id} href={`/notes?tags=${tag.id}`}>
                      <div className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors cursor-pointer">
                        <TagBadge tag={tag} />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {tag.note_count} note{tag.note_count === 1 ? '' : 's'}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {tags.length > 5 && (
                    <Link href="/tags">
                      <Button variant="ghost" size="sm" className="text-primary">
                        +{tags.length - 5} more
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
