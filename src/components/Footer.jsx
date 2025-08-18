export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#0c0a12]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-white text-lg font-semibold">Vamoos Clips</h4>
            <p className="text-sm text-gray-400">
              Найкращі моменти з українського Twitch.
            </p>
          </div>

          <nav className="flex items-center gap-5">
            <a
              href="https://www.twitch.tv/vammmosss"
              target="_blank"
              rel="noreferrer"
              className="text-gray-300 hover:text-white transition"
              aria-label="Twitch"
              title="Мій Twitch"
            >
              <svg
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4 3h16v10.5L16.5 17H13l-2.5 2.5H8v-2.5H4V3zm2 2v9h3v2h1.5L13 14h3l2-2V5H6zm8 2h2v4h-2V7zm-5 0h2v4H9V7z" />
              </svg>
            </a>

            <a
              href="https://t.me/vamooschannel"
              target="_blank"
              rel="noreferrer"
              className="text-gray-300 hover:text-white transition"
              aria-label="Telegram"
              title="Наш Telegram"
            >
              <svg
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M9.5 13.5l-.4 4.1c.6 0 .8-.3 1.1-.6l2.6-2.5 5.4 4c1 .6 1.7.3 2-.9l3.6-16.9c.3-1.2-.4-1.7-1.4-1.4L1.6 8.7C.4 9.1.4 9.8 1.4 10.1l5.9 1.8 13.7-8.6-11.5 10.2z" />
              </svg>
            </a>

            <a
              href="https://www.youtube.com/@vamoosnarizky"
              target="_blank"
              rel="noreferrer"
              className="text-gray-300 hover:text-white transition"
              aria-label="YouTube"
              title="YouTube"
            >
              <svg
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.5 6.2c-.3-1.3-1.3-2.2-2.6-2.3C18.8 3.6 12 3.6 12 3.6s-6.8 0-8.9.3C1.8 4 1 5 0.7 6.2 0.4 7.5 0.4 10 0.4 10s0 2.5.3 3.8c.3 1.3 1.1 2.2 2.4 2.3 2.1.3 8.9.3 8.9.3s6.8 0 8.9-.3c1.3-.1 2.3-1 2.6-2.3.3-1.3.3-3.8.3-3.8s0-2.5-.3-3.8zM9.8 14.4V7.6l6 3.4-6 3.4z" />
              </svg>
            </a>
          </nav>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          © {new Date().getFullYear()} Vamoos Clips. Всі права захищені.
        </div>
      </div>
    </footer>
  );
}
