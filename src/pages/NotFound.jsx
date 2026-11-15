import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="vc-root">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-4 py-24 sm:px-6">
        <h1 className="vc-display m-0 text-[clamp(64px,13vw,180px)] font-black uppercase leading-[1.12] tracking-[-0.05em]">
          4<span className="text-[var(--vc-accent)]">0</span>4
        </h1>
        <p className="m-0 max-w-[520px] text-lg text-[var(--vc-muted)]">
          Такої сторінки немає. Можливо, посилання з помилкою або сторінку прибрали.
        </p>
        <Link
          to="/"
          className="vc-display flex min-h-[56px] w-fit items-center bg-[var(--vc-accent)] px-7 text-sm font-bold uppercase text-[var(--vc-bg)] no-underline"
        >
          На головну →
        </Link>
      </div>
    </div>
  );
}
export default NotFound;
