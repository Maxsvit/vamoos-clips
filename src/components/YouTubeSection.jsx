function YouTubeSection() {
  const linkBtn =
    "px-5 py-2 md:text-xl rounded-2xl text-[15px] md text-white font-bold " +
    "bg-gradient-to-br from-red-500 to-fuchsia-500 " +
    "hover:from-red-400 hover:to-fuchsia-400 " +
    "border border-white/10 shadow-[0_4px_20px_rgba(139,92,246,.25)] " +
    "transition-all duration-200 hover:shadow-[0_6px_26px_rgba(139,92,246,.35)] hover:translate-y-[-1px]";
  return (
    <div className="flex justify-center items-center p-4 ">
      <div className="bg-[#0f0d18] w-[720px] md:w-[920px] py-10 rounded-lg  text-center p-2.5">
        <div className="text-2xl font-extrabold md:text-4xl text-white">
          Приєднуйся до нашого YouTube каналу 🔔
        </div>
        <div className="text-gray-300 text-sm md:text-lg py-8 ">
          Ми готуємо добірки найкращих моментів з українського Twitch. Не
          пропусти нові випуски, ексклюзиви та найсмішніші хайлайти, які не
          потрапляють на стріми.
        </div>
        <a
          href="https://www.youtube.com/@vamoosnarizky"
          target="_blank"
          rel="noopener noreferrer"
          className={linkBtn}
        >
          Перейти на YouTube 🚀
        </a>
      </div>
    </div>
  );
}
export default YouTubeSection;
