import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import ClipMonthVoting from "../components/ClipMonthVoting";

/** Той самий стиль, що кнопка «Кліп місяця» в наві — салатовий */
const submitClipLinkClass =
  "inline-flex items-center align-baseline rounded-lg px-2.5 py-1 text-xs font-bold text-white " +
  "bg-gradient-to-br from-emerald-500 to-teal-600 " +
  "hover:from-emerald-400 hover:to-teal-500 " +
  "border border-emerald-300/30 shadow-[0_2px_14px_rgba(16,185,129,.35)] " +
  "transition-all duration-200 hover:shadow-[0_3px_18px_rgba(16,185,129,.45)] hover:-translate-y-px " +
  "no-underline mx-0.5";

/** Суми призів у картці «Результати» — трохи яскравіше за основний текст */
const prizeMoneyClass =
  "text-amber-200 font-semibold tabular-nums drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]";

const stepBadgeClass = "from-emerald-500 to-teal-600";
const TELEGRAM_URL = "https://t.me/vamooschannel";
const YOUTUBE_URL = "https://www.youtube.com/@vamoosnarizky";

const contestCtaBtnClass =
  "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold text-white no-underline " +
  "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 " +
  "border border-emerald-300/30 shadow-[0_6px_22px_rgba(16,185,129,.35)] " +
  "transition-all duration-200 hover:-translate-y-px hover:shadow-[0_9px_28px_rgba(16,185,129,.45)]";

const contestCtaBtnGhostClass =
  "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-emerald-100 no-underline " +
  "bg-white/[0.03] hover:bg-white/[0.06] border border-emerald-400/25 " +
  "shadow-[0_6px_18px_rgba(0,0,0,.25)] transition-all duration-200 hover:-translate-y-px";

/**
 * Тур: з 1-го по останній день місяця — подача → голосування за попередній місяць
 * (паралельно збір на новий) → кожного 6 числа нового місяця — підсумки в Telegram.
 */
const CONTEST_YEAR = 2026;

const MONTHS_GENITIVE_UK = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
];

const MONTHS_NOMINATIVE_UK = [
  "січень",
  "лютий",
  "березень",
  "квітень",
  "травень",
  "червень",
  "липень",
  "серпень",
  "вересень",
  "жовтень",
  "листопад",
  "грудень",
];

/** Один тур: змінюй лише тут — назви місяців у текстах підставляться самі. */
function getContestSchedule(year = CONTEST_YEAR) {
  return {
    submitStart: new Date(year, 3, 1, 0, 0, 0, 0),
    submitEnd: new Date(year, 3, 30, 23, 59, 59, 999),
    voteStart: new Date(year, 4, 1, 0, 0, 0, 0),
    voteEnd: new Date(year, 4, 6, 23, 59, 59, 999),
    resultsAnnounce: new Date(year, 4, 6, 12, 0, 0, 0),
    resultsEndShow: new Date(year, 4, 20, 23, 59, 59, 999),
  };
}

function dayMonthGenitiveUk(d, includeYear = true) {
  const day = d.getDate();
  const m = d.getMonth();
  const y = d.getFullYear();
  const yPart = includeYear ? ` ${y}` : "";
  return `${day} ${MONTHS_GENITIVE_UK[m]}${yPart}`;
}

function formatVoteRangeUk(schedule) {
  const d1 = schedule.voteStart;
  const d2 = schedule.voteEnd;
  const m1 = d1.getMonth();
  const m2 = d2.getMonth();
  const y = d2.getFullYear();
  if (m1 === m2) {
    return `з ${d1.getDate()} по ${d2.getDate()} ${MONTHS_GENITIVE_UK[m2]} ${y}`;
  }
  return `з ${dayMonthGenitiveUk(d1)} по ${dayMonthGenitiveUk(d2)}`;
}

/** Місяць подачі (фіналісти) род. відмінок + місяць паралельної подачі називний. */
function getParallelMonthLabels(schedule) {
  const subM = schedule.submitEnd.getMonth();
  const voteM = schedule.voteStart.getMonth();
  return {
    finalistsMonthGenitive: MONTHS_GENITIVE_UK[subM],
    newTourMonthNominative: MONTHS_NOMINATIVE_UK[voteM],
  };
}

/**
 * Прев’ю без прив’язки до календаря: показати конкретну фазу.
 * null — рахувати фазу за датами туру нижче.
 * @type {null | "upcoming" | "submission" | "voting" | "results" | "idle"}
 */
const PREVIEW_PHASE = null;

function getContestPhase(now = new Date()) {
  const y = CONTEST_YEAR;
  if (PREVIEW_PHASE) {
    return { kind: PREVIEW_PHASE, year: y };
  }
  const s = getContestSchedule(y);
  if (now < s.submitStart) {
    return { kind: "upcoming", year: y };
  }
  if (now <= s.submitEnd) {
    return { kind: "submission", year: y };
  }
  if (now >= s.voteStart && now <= s.voteEnd) {
    return { kind: "voting", year: y };
  }
  if (now <= s.resultsEndShow) {
    return { kind: "results", year: y };
  }
  return { kind: "idle", year: y };
}

function WaitingDots() {
  return (
    <span
      className="inline-flex gap-1.5 ml-1 align-middle translate-y-[-2px]"
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 clip-month-status__dot"
        />
      ))}
    </span>
  );
}

/** Під час голосування за попередній місяць — нагадування про вже відкриту подачу за новий. */
function ParallelSubmissionDuringVoting({
  finalistsMonthGenitive,
  newTourMonthNominative,
}) {
  return (
    <div
      className={
        "mt-5 rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-emerald-950/55 to-gray-900/70 " +
        "p-5 text-left ring-1 ring-emerald-500/25 shadow-[0_8px_32px_rgba(16,185,129,.12)]"
      }
    >
      <p className="text-emerald-300/95 text-xs font-semibold uppercase tracking-wide">
        Паралельно відкритий збір
      </p>
      <p className="text-white text-base font-semibold mt-2 leading-snug">
        Поки триває голосування за фіналістів{" "}
        <span className="text-amber-200">{finalistsMonthGenitive}</span>, уже
        можна надсилати кліпи на конкурс{" "}
        <span className="text-emerald-300">{newTourMonthNominative}</span>.
      </p>
      <p className="text-gray-400 text-sm mt-2 leading-relaxed">
        Не треба чекати кінця голосування: форма нижче на сайті — окремий збір саме
        за новий календарний місяць туру.
      </p>
      <div className="mt-4">
        <Link
          to="/submit"
          className={
            "inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-bold text-white " +
            "bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 " +
            "border border-emerald-400/30 shadow-[0_4px_20px_rgba(16,185,129,.35)] " +
            "transition-all hover:shadow-[0_6px_28px_rgba(16,185,129,.45)] hover:-translate-y-px no-underline"
          }
        >
          Додати кліп за {newTourMonthNominative} →
        </Link>
      </div>
    </div>
  );
}

function ContestStatus() {
  const phase = getContestPhase(new Date());
  const schedule = getContestSchedule(phase.year);
  const parallel = getParallelMonthLabels(schedule);

  const wrap = (children, pulse = true) => (
    <div
      className={
        "rounded-2xl bg-gradient-to-br from-amber-950/90 to-gray-900/95 ring-1 ring-amber-500/30 p-6 md:p-7 " +
        (pulse ? "clip-month-status--pulse" : "")
      }
    >
      {children}
    </div>
  );

  if (phase.kind === "upcoming") {
    return wrap(
      <>
        <p className="text-amber-300/90 text-xs font-semibold uppercase tracking-wide mb-2">
          Незабаром
        </p>
        <p className="text-white text-lg font-semibold">
          Перший тур «Кліп місяця» стартує{" "}
          <span className="text-amber-300">
            {dayMonthGenitiveUk(schedule.submitStart)}
          </span>
          .
        </p>
        <p className="text-gray-400 mt-2 text-sm leading-relaxed">
          Тут з’явиться актуальний статус: збір кліпів, відбір, голосування та
          результати.
        </p>
      </>,
      false
    );
  }

  if (phase.kind === "submission") {
    return wrap(
      <>
        <p className="text-amber-300/90 text-xs font-semibold uppercase tracking-wide mb-2">
          Зараз: збір кліпів
        </p>
        <>
          <p className="text-white text-lg font-semibold leading-snug">
            Приймаємо кліпи до{" "}
            <span className="text-amber-300">
              {dayMonthGenitiveUk(schedule.submitEnd, false)}
            </span>
            {" "}
            <WaitingDots />
          </p>
          <p className="text-gray-300 mt-4 leading-relaxed">
            Наразі дивимось ваші кліпи й відбираємо — зачекай{" "}
            <span className="text-amber-200/95 font-medium">кінця місяця</span>: після{" "}
            {dayMonthGenitiveUk(schedule.submitEnd, false)} сформуємо шортлист і
            відкриємо голосування{" "}
            <span className="text-white/95">
              з {schedule.voteStart.getDate()} по {schedule.voteEnd.getDate()}{" "}
              {MONTHS_GENITIVE_UK[schedule.voteEnd.getMonth()]}
            </span>.
          </p>
        </>
      </>,
      true
    );
  }

  if (phase.kind === "voting") {
    return wrap(
      <>
        <p className="text-amber-300/90 text-xs font-semibold uppercase tracking-wide mb-2">
          Зараз: голосування
        </p>
        <p className="text-white text-lg font-semibold leading-snug">
          Обери улюблений кліп серед фіналістів — до{" "}
          <span className="text-amber-300">
            {dayMonthGenitiveUk(schedule.voteEnd, false)}
          </span>{" "}
          <WaitingDots />
        </p>
        <p className="text-gray-400 mt-3 text-sm">
          Нижче на сторінці — список фіналістів і кнопка голосу (потрібен вхід через
          Twitch). Один акаунт — один голос за тур, без повторного голосування.
        </p>
        <ParallelSubmissionDuringVoting
          finalistsMonthGenitive={parallel.finalistsMonthGenitive}
          newTourMonthNominative={parallel.newTourMonthNominative}
        />
      </>,
      true
    );
  }

  if (phase.kind === "results") {
    return wrap(
      <>
        <p className="text-amber-300/90 text-xs font-semibold uppercase tracking-wide mb-2">
          Підсумки туру
        </p>
        <p className="text-white text-lg font-semibold">
          Результати —{" "}
          <span className="text-amber-300">
            {dayMonthGenitiveUk(schedule.resultsAnnounce)}
          </span>
          . Оголошення переможців і рейтингу — у нашому Telegram.
        </p>
      </>,
      false
    );
  }

  return wrap(
    <>
      <p className="text-gray-300 text-lg font-semibold">
        Наступний тур «Кліп місяця» — анонс на каналі
      </p>
      <p className="text-gray-500 mt-2 text-sm">
        Коли відкриємо новий збір, тут знову з’явиться статус.
      </p>
    </>,
    false
  );
}

function getSubmissionStepRange() {
  return "1 — останній день місяця";
}

export default function ClipOfMonth() {
  const phase = getContestPhase(new Date());
  const schedule = getContestSchedule(CONTEST_YEAR);
  const parallel = getParallelMonthLabels(schedule);

  const steps = [
    {
      title: "Подача кліпів",
      range: getSubmissionStepRange(),
      body: (
        <>
          <p>
            Надішли свій Twitch-кліп через форму на сайті.
          </p>
          <div className="mt-4">
            <Link to="/submit" className={submitClipLinkClass}>
              Додати кліп
            </Link>
          </div>
        </>
      ),
    },
    {
      title: "Відбір фіналістів",
      range: "після закриття подачі",
      body:
        "Команда обирає до 10 кліпів у фінальне голосування.",
    },
    {
      title: "Голосування",
      range: "з 1 по 6 кожного місяця",
      body: (
        <>
          <p>
            Глядачі голосують за фіналістів. У цей самий період на сайті вже
            відкрита нова подача кліпів.
          </p>
        </>
      ),
    },
    {
      title: "Результати",
      range: dayMonthGenitiveUk(schedule.resultsAnnounce, false),
      body: (
        <>
          <p>
            Рейтинг і переможці — <strong>кожного 6 числа</strong> у нашому Telegram.
          </p>
          <p>
            Призи: 1 місце — <span className={prizeMoneyClass}>1000 ₴</span>, 2 місце —{" "}
            <span className={prizeMoneyClass}>500 ₴</span>, 3 місце —{" "}
            <span className={prizeMoneyClass}>500 ₴</span>.
          </p>
          <p>
            Автор кліпу, що потрапить у топ-3, отримує грошовий приз.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <section className="pt-32 pb-12 px-4 text-center max-w-3xl mx-auto">
        <p className="text-amber-400/90 text-sm font-semibold tracking-wide uppercase mb-2">
          Щомісячний конкурс
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent">
          Кліп місяця
        </h1>
        <p className="text-gray-400 text-lg">
          Один цикл — подача, відбір, голосування й фінал. Нижче коротко, як це
          виглядатиме.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((s, i) => (
          <article
            key={s.title}
            className="rounded-2xl bg-gray-900/80 ring-1 ring-amber-500/20 shadow-[0_8px_32px_rgba(0,0,0,.35)] p-6 md:p-8 h-full"
          >
            <div className="flex items-start  gap-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stepBadgeClass} text-lg font-bold text-white shadow-lg`}
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="text-left min-w-0">
                <h2 className="text-xl font-semibold text-white">{s.title}</h2>
                <p className="text-emerald-300/95 font-semibold text-sm mt-1 whitespace-nowrap">
                  {s.range}
                </p>
                <div className="text-gray-400 mt-3 leading-relaxed text-[15px] space-y-2 [&_p+p]:mt-0">
                  {typeof s.body === "string" ? <p>{s.body}</p> : s.body}
                </div>
              </div>
            </div>
          </article>
        ))}

        <div className="md:col-span-2 mt-2">
          <ContestStatus />
        </div>

        {phase.kind === "voting" && (
          <div className="md:col-span-2 mt-8">
            <ClipMonthVoting />
          </div>
        )}

        <div className="md:col-span-2 mt-4">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#0f172a] via-[#0a1323] to-[#07131a] p-6 md:p-8 text-center shadow-[0_20px_70px_rgba(0,0,0,.45)]">
            <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-10 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl" />
            <p className="relative inline-flex items-center rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Конкурсний хаб
            </p>
            <h3 className="relative mt-3 text-2xl md:text-3xl font-extrabold text-white">
              Слідкуй за оновленнями і подавай кліпи
            </h3>
            <p className="relative mt-3 text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Переходь на наші канали, щоб не пропускати новини конкурсу, та
              надсилай свій кліп у форму подачі.
            </p>
            <div className="relative mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noreferrer"
                className={contestCtaBtnGhostClass}
              >
                YouTube
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className={contestCtaBtnGhostClass}
              >
                Telegram
              </a>
              <Link to="/submit" className={contestCtaBtnClass}>
                Кинути кліп
              </Link>
            </div>
          </div>
        </div>

      </section>

      <Footer />
    </div>
  );
}
