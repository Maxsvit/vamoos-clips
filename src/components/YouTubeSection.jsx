function YouTubeSection() {
  return (
    <section className="border-t border-[var(--vc-line)]">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-8 px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex max-w-[720px] flex-col gap-5">
          <span className="vc-mono text-[13px] text-[var(--vc-accent)]">[ YOUTUBE ] НОВІ ВИПУСКИ</span>
          <h2 className="vc-display m-0 text-[clamp(28px,3.6vw,52px)] font-black uppercase leading-[1.12] tracking-[-0.035em]">
            Добірки, які не <span className="text-[var(--vc-accent)]">потрапили</span> на стрім
          </h2>
          <p className="m-0 text-[17px] leading-relaxed text-[var(--vc-muted)]">
            Найкращі моменти українського Twitch, ексклюзиви та найсмішніші хайлайти. Підписуйся, щоб не
            пропустити нові випуски.
          </p>
        </div>
        <a
          href="https://www.youtube.com/@vamoosnarizky"
          target="_blank"
          rel="noopener noreferrer"
          className="vc-display flex min-h-[64px] items-center bg-[var(--vc-accent)] px-7 text-[15px] font-bold uppercase text-[var(--vc-bg)] no-underline"
        >
          Перейти на YouTube ↗
        </a>
      </div>
    </section>
  );
}
export default YouTubeSection;
