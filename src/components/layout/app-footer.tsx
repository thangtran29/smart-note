export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>© {currentYear} Smart Notes. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <a
              href="#"
              className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Terms
            </a>
            <a
              href="#"
              className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

