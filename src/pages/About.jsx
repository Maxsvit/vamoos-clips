import Footer from "../components/Footer";
import nasty from "../assets/img/nasty.jpg";
import nosochek from "../assets/img/nosochek.jpg";
import vamoos from "../assets/img/vamoos.jpg";

export default function About() {
  const team = [
    {
      name: "Vamoos",
      role: "Контент-менеджер, розробник, дизайнер, адміністратор",
      desc: "Займаюсь всім по трошку, але починав саме з ідей та контенту.",
      image: vamoos,
    },
    {
      name: "Носочек Шкарпеткович",
      role: "Помічник по всьому",
      desc: "Цю людину можна попросити про все, що завгодно. Він завжди допоможе!",
      image: nosochek,
    },
    {
      name: "Nasty Cringe",
      role: "Монтажер, редактор, стрімер",
      desc: "Монтує кліпи, допомагає з редагуванням та активно стрімить на Twitch.",
      image: nasty,
    },
  ];
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <section className="py-32 text-center">
        <h1 className="text-4xl font-bold mb-4">Про нас</h1>
        <p className="text-gray-400">
          Наша мета — зробити зручний майданчик для обміну кліпами та переглядом
          цікавого українського контенту.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8 max-w-6xl mx-auto">
        {team.map((person, i) => (
          <div
            key={i}
            className="bg-gray-800 p-6 rounded-2xl shadow-lg hover:scale-105 transition"
          >
            <div className="w-24 h-24 rounded-full bg-gray-600 mx-auto mb-4">
              <img
                src={person.image}
                alt={person.name}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <h2 className="text-xl font-semibold">{person.name}</h2>
            <p className="text-indigo-400">{person.role}</p>
            <p className="text-gray-400 mt-2">{person.desc}</p>

            {person.name === "Nasty Cringe" && (
              <a
                href="https://www.twitch.tv/nasty_cringe"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mt-3 justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                >
                  <path d="M4 2L2 6v14h6v2h4l2-2h4l4-4V2H4zm16 12l-2 2h-6l-2 2v-2H6V4h14v10z" />
                  <path d="M14 6h2v5h-2zm-4 0h2v5h-2z" />
                </svg>
                nasty_cringe
              </a>
            )}
          </div>
        ))}
      </section>

      <section className="py-20 px-8 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">Хочеш співпрацювати?</h2>
        <p className="text-gray-400 mb-8">
          Якщо маєш питання або ідеї — напиши мені у зручний спосіб:
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <a
            href="https://t.me/martixmax"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            📢 Telegram
          </a>
          <a
            href="mailto:themainview@gmail.com"
            className="px-6 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            ✉️ Email
          </a>
        </div>
      </section>
      <Footer />
    </div>
  );
}
