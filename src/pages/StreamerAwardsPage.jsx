import { useEffect, useState } from "react";
import code from "../assets/img/qr-code.jpg";
import YouTubeSection from "../components/YouTubeSection";
import Footer from "../components/Footer";

const VOTE_API_URL = "/api/viewers-choice";
const VOTER_TOKEN_KEY = "vamoos_awards_voter_id";
const HAS_VOTED_KEY = "vamoos_awards_has_voted";

const VOTING_DEADLINE = "2025-12-31T21:00:00+02:00";
const VOTING_DEADLINE_DISPLAY = "31.12.2025";

const STREAMERKA_OF_THE_YEAR_NOMINEES = [
  { id: "missmartik", name: "missmartik", nickname: "missmartik", login: "missmartik" },
  { id: "veron_khalepa", name: "veron_khalepa", nickname: "veron_khalepa", login: "veron_khalepa" },
  { id: "calypsopaw", name: "calypsopaw", nickname: "calypsopaw", login: "calypsopaw" },
  { id: "itsgolovna", name: "itsgolovna", nickname: "itsgolovna", login: "itsgolovna" },
  { id: "velmira_astrid", name: "velmira_astrid", nickname: "velmira_astrid", login: "velmira_astrid" },
  { id: "nyavka", name: "nyavka", nickname: "nyavka", login: "nyavka" },
  { id: "riomyri", name: "riomyri", nickname: "riomyri", login: "riomyri" },
  { id: "maryashik", name: "maryashik", nickname: "maryashik", login: "maryashik" },
  { id: "janetty_y", name: "janetty_y", nickname: "janetty_y", login: "janetty_y" },
  { id: "moonosya", name: "moonosya", nickname: "moonosya", login: "moonosya" },
  { id: "sheisfoxy", name: "sheisfoxy", nickname: "sheisfoxy", login: "sheisfoxy" },
  { id: "totoykaa", name: "totoykaa", nickname: "totoykaa", login: "totoykaa" },
  { id: "qwertyrra", name: "qwertyrra", nickname: "qwertyrra", login: "qwertyrra" },
  { id: "my_pivnich", name: "my_pivnich", nickname: "my_pivnich", login: "my_pivnich" },
  { id: "cusnee", name: "cusnee", nickname: "cusnee", login: "cusnee" },
  { id: "akyulia", name: "akyulia", nickname: "akyulia", login: "akyulia" },
  { id: "sonialimm", name: "sonialimm", nickname: "sonialimm", login: "sonialimm" },
  { id: "lidusik_more", name: "lidusik_more", nickname: "lidusik_more", login: "lidusik_more" },
  { id: "alinariuk", name: "alinariuk", nickname: "alinariuk", login: "alinariuk" },
  { id: "xaripso", name: "xaripso", nickname: "xaripso", login: "xaripso" },
  { id: "thejulles", name: "thejulles", nickname: "thejulles", login: "thejulles" },
  { id: "alex_lova", name: "alex_lova", nickname: "alex_lova", login: "alex_lova" },
  { id: "dobra_divka", name: "Dobra_Divka", nickname: "dobra_divka", login: "dobra_divka" },
  { id: "recooniii", name: "recooniii", nickname: "recooniii", login: "recooniii" },
  { id: "cyberkvitochka", name: "cyberkvitochka", nickname: "cyberkvitochka", login: "cyberkvitochka" },
  { id: "maaaaarriiiii", name: "maaaaarriiiii", nickname: "maaaaarriiiii", login: "maaaaarriiiii" },
  { id: "nerzhaviyka", name: "nerzhaviyka", nickname: "nerzhaviyka", login: "nerzhaviyka" },
  { id: "pankraatik", name: "pankraatik", nickname: "pankraatik", login: "pankraatik" },
  { id: "kuzhel_", name: "kuzhel_", nickname: "kuzhel_", login: "kuzhel_" },
  { id: "verholaa", name: "verholaa", nickname: "verholaa", login: "verholaa" },
  { id: "umi_chi_umi", name: "umi_chi_umi", nickname: "umi_chi_umi", login: "umi_chi_umi" },
  { id: "nasty_cringe", name: "nasty_cringe", nickname: "nasty_cringe", login: "nasty_cringe" },
  { id: "do3r1n", name: "do3r1n", nickname: "do3r1n", login: "do3r1n" },
  { id: "zmiu_shka", name: "zmiu_shka", nickname: "zmiu_shka", login: "zmiu_shka" },
  { id: "lunarilunaa", name: "lunarilunaa", nickname: "lunarilunaa", login: "lunarilunaa" },
  { id: "theoliviette", name: "theoliviette", nickname: "theoliviette", login: "theoliviette" },
  { id: "itismirai", name: "itismirai", nickname: "itismirai", login: "itismirai" },
  { id: "drita_no_bez_d", name: "drita_no_bez_d", nickname: "drita_no_bez_d", login: "drita_no_bez_d" },
  { id: "sss0li", name: "sss0li", nickname: "sss0li", login: "sss0li" },
  { id: "pixie_itsme", name: "pixie_itsme", nickname: "pixie_itsme", login: "pixie_itsme" },
  { id: "nastya_patsiuk", name: "nastya_patsiuk", nickname: "nastya_patsiuk", login: "nastya_patsiuk" },
  { id: "ssofikooooo", name: "ssofikooooo", nickname: "ssofikooooo", login: "ssofikooooo" },
  { id: "solodana", name: "solodana", nickname: "solodana", login: "solodana" },
  { id: "roki_sid", name: "roki_sid", nickname: "roki_sid", login: "roki_sid" },
  { id: "oryblabla", name: "oryblabla", nickname: "oryblabla", login: "oryblabla" },
  { id: "adult_woman", name: "adult_woman", nickname: "adult_woman", login: "adult_woman" },
  { id: "depressedcatss", name: "depressedcatss", nickname: "depressedcatss", login: "depressedcatss" },
  { id: "dramacat", name: "dramacat", nickname: "dramacat", login: "dramacat" },
  { id: "grudnevaaa", name: "grudnevaaa", nickname: "grudnevaaa", login: "grudnevaaa" },
  { id: "evil_kaya", name: "evil_kaya", nickname: "evil_kaya", login: "evil_kaya" },
  { id: "aaavrora", name: "aaavrora", nickname: "aaavrora", login: "aaavrora" },
  { id: "dasha_hahaa", name: "dasha_hahaa", nickname: "dasha_hahaa", login: "dasha_hahaa" },
  { id: "bar_cy4ok", name: "bar_cy4ok", nickname: "bar_cy4ok", login: "bar_cy4ok" },
  { id: "aloriwinderer", name: "aloriwinderer", nickname: "aloriwinderer", login: "aloriwinderer" },
  { id: "marinade_vtuber", name: "marinade_vtuber", nickname: "marinade_vtuber", login: "marinade_vtuber" },
  { id: "luma_rum", name: "luma_rum", nickname: "luma_rum", login: "luma_rum" },
  { id: "helliaska", name: "helliaska", nickname: "helliaska", login: "helliaska" },
  { id: "minozavr", name: "minozavr", nickname: "minozavr", login: "minozavr" },
  { id: "turtle_silent", name: "turtle_silent", nickname: "turtle_silent", login: "turtle_silent" },
  { id: "lodianyk", name: "lodianyk", nickname: "lodianyk", login: "lodianyk" },
  { id: "yunvi_", name: "yunvi_", nickname: "yunvi_", login: "yunvi_" },
  { id: "xoxomka", name: "xoxomka", nickname: "xoxomka", login: "xoxomka" },
  { id: "kokosovakoza", name: "kokosovakoza", nickname: "kokosovakoza", login: "kokosovakoza" },
  { id: "NeTaneToy", name: "NeTaneToy", nickname: "NeTaneToy", login: "NeTaneToy" },
  { id: "nata_riya", name: "nata_riya", nickname: "nata_riya", login: "nata_riya" },
  { id: "cakeislieee", name: "cakeislieee", nickname: "cakeislieee", login: "cakeislieee" },
  { id: "sweetlyvii", name: "sweetlyvii", nickname: "sweetlyvii", login: "sweetlyvii" },
  { id: "milatnm", name: "milatnm", nickname: "milatnm", login: "milatnm" },
  { id: "e_wexy", name: "e_wexy", nickname: "e_wexy", login: "e_wexy" },
  { id: "felix_legion", name: "felix_legion", nickname: "felix_legion", login: "felix_legion" },
  { id: "lizetkaa", name: "lizetkaa", nickname: "lizetkaa", login: "lizetkaa" },
  { id: "evgeniusd", name: "evgeniusd", nickname: "evgeniusd", login: "evgeniusd" },
  { id: "Tse_Jenya_i_Anya", name: "Tse_Jenya_i_Anya", nickname: "Tse_Jenya_i_Anya", login: "Tse_Jenya_i_Anya" },
  { id: "vtomleni", name: "vtomleni", nickname: "vtomleni", login: "vtomleni" },
  { id: "Lady_Skeify", name: "Lady_Skeify", nickname: "Lady_Skeify", login: "Lady_Skeify" },
  { id: "Karmaliya", name: "Karmaliya", nickname: "Karmaliya", login: "Karmaliya" },
  { id: "mamura_senpai", name: "mamura_senpai", nickname: "mamura_senpai", login: "mamura_senpai" },
  { id: "yanakama07", name: "yanakama07", nickname: "yanakama07", login: "yanakama07" },
  { id: "kalendora", name: "kalendora", nickname: "kalendora", login: "kalendora" },
  { id: "yuzia_online", name: "yuzia_online", nickname: "yuzia_online", login: "yuzia_online" },
  { id: "t0temka", name: "t0temka", nickname: "t0temka", login: "t0temka" },
  { id: "stervo_", name: "stervo_", nickname: "stervo_", login: "stervo_" },
  { id: "polivalko", name: "polivalko", nickname: "polivalko", login: "polivalko" },
  { id: "pani_pypkaa", name: "pani_pypkaa", nickname: "pani_pypkaa", login: "pani_pypkaa" },
  { id: "tsivak", name: "tsivak", nickname: "tsivak", login: "tsivak" },
  { id: "rak_cheburak", name: "rak_cheburak", nickname: "rak_cheburak", login: "rak_cheburak" },
  { id: "jane_inglasses", name: "jane_inglasses", nickname: "jane_inglasses", login: "jane_inglasses" },
  { id: "fir_fi_", name: "fir_fi_", nickname: "fir_fi_", login: "fir_fi_" },
  { id: "blessed_blest", name: "blessed_blest", nickname: "blessed_blest", login: "blessed_blest" },
  { id: "zarikxx_", name: "zarikxx_", nickname: "zarikxx_", login: "zarikxx_" },
  { id: "hornyyoyi", name: "hornyyoyi", nickname: "hornyyoyi", login: "hornyyoyi" },
  { id: "sundora", name: "sundora", nickname: "sundora", login: "sundora" },
  { id: "bigpigboss_", name: "bigpigboss_", nickname: "bigpigboss_", login: "bigpigboss_" },
  { id: "himetyanart", name: "himetyanart", nickname: "himetyanart", login: "himetyanart" },
  { id: "tati_tv", name: "tati_tv", nickname: "tati_tv", login: "tati_tv" },
  { id: "mijulsss", name: "mijulsss", nickname: "mijulsss", login: "mijulsss" },
  { id: "fowie_chan", name: "fowie_chan", nickname: "fowie_chan", login: "fowie_chan" },
  { id: "rion_anya", name: "rion_anya", nickname: "rion_anya", login: "rion_anya" },
  { id: "333geramori", name: "333geramori", nickname: "333geramori", login: "333geramori" },
  { id: "sekhmet_dmn", name: "sekhmet_dmn", nickname: "sekhmet_dmn", login: "sekhmet_dmn" },
  { id: "kostikovna", name: "kostikovna", nickname: "kostikovna", login: "kostikovna" },
  { id: "akililpotato", name: "akililpotato", nickname: "akililpotato", login: "akililpotato" },
  { id: "nimuuue_", name: "nimuuue_", nickname: "nimuuue_", login: "nimuuue_" },
  { id: "ferxthebard", name: "ferxthebard", nickname: "ferxthebard", login: "ferxthebard" },
  { id: "kyoko_ua_vtuber", name: "kyoko_ua_vtuber", nickname: "kyoko_ua_vtuber", login: "kyoko_ua_vtuber" },
  { id: "potishka", name: "potishka", nickname: "potishka", login: "potishka" },
  { id: "merychan_kikoyo", name: "merychan_kikoyo", nickname: "merychan_kikoyo", login: "merychan_kikoyo" },
  { id: "fon_vt", name: "fon_vt", nickname: "fon_vt", login: "fon_vt" },
  { id: "amanenana", name: "amanenana", nickname: "amanenana", login: "amanenana" },
  { id: "2xmon", name: "2xmon", nickname: "2xmon", login: "2xmon" },
  { id: "liryvt", name: "liryvt", nickname: "liryvt", login: "liryvt" },
  { id: "wayllis", name: "wayllis", nickname: "wayllis", login: "wayllis" },
  { id: "amattoart", name: "amattoart", nickname: "amattoart", login: "amattoart" },
  { id: "h_o_r_b_e_l", name: "h_o_r_b_e_l", nickname: "h_o_r_b_e_l", login: "h_o_r_b_e_l" },
  { id: "mini_dara", name: "mini_dara", nickname: "mini_dara", login: "mini_dara" },
  { id: "kuaskiogb", name: "kuaskiogb", nickname: "kuaskiogb", login: "kuaskiogb" },
  { id: "admeka", name: "admeka", nickname: "admeka", login: "admeka" },
  { id: "ara_ara_arazuki", name: "ara_ara_arazuki", nickname: "ara_ara_arazuki", login: "ara_ara_arazuki" },
  { id: "pochyyaa", name: "pochyyaa", nickname: "pochyyaa", login: "pochyyaa" },
  { id: "green_fukuroy", name: "green_fukuroy", nickname: "green_fukuroy", login: "green_fukuroy" },
  { id: "milaaha", name: "milaaha", nickname: "milaaha", login: "milaaha" },
  { id: "lizlovenni", name: "lizlovenni", nickname: "lizlovenni", login: "lizlovenni" },
  { id: "madyfroggy", name: "madyfroggy", nickname: "madyfroggy", login: "madyfroggy" },
  { id: "dntude", name: "dntude", nickname: "dntude", login: "dntude" },
  { id: "tvorchi_varenychky", name: "tvorchi_varenychky", nickname: "tvorchi_varenychky", login: "tvorchi_varenychky" },
  { id: "lysychka_ri", name: "lysychka_ri", nickname: "lysychka_ri", login: "lysychka_ri" },
  { id: "asya_ua_vtuber", name: "asya_ua_vtuber", nickname: "asya_ua_vtuber", login: "asya_ua_vtuber" },
  { id: "luyorin", name: "luyorin", nickname: "luyorin", login: "luyorin" },
  { id: "netremba", name: "netremba", nickname: "netremba", login: "netremba" },
  { id: "kaori_vtuber", name: "kaori_vtuber", nickname: "kaori_vtuber", login: "kaori_vtuber" },
  { id: "token", name: "token", nickname: "token", login: "token" },
  { id: "margsaur", name: "margsaur", nickname: "margsaur", login: "margsaur" },
  { id: "lilpersyk", name: "lilpersyk", nickname: "lilpersyk", login: "lilpersyk" },
  { id: "TouchtheGeometry", name: "TouchtheGeometry", nickname: "TouchtheGeometry", login: "TouchtheGeometry" },
  { id: "tisonechko", name: "tisonechko", nickname: "tisonechko", login: "tisonechko" },
  { id: "crymii_", name: "crymii_", nickname: "crymii_", login: "crymii_" },
  { id: "kevelovek", name: "kevelovek", nickname: "kevelovek", login: "kevelovek" },
  { id: "d1vka", name: "d1vka", nickname: "d1vka", login: "d1vka" }
];

const DEBUT_OF_THE_YEAR_NOMINEES = [
  { id: "valentinopradagucci", name: "valentinopradagucci", nickname: "valentinopradagucci", login: "valentinopradagucci" },
  { id: "panmykolai", name: "panmykolai", nickname: "panmykolai", login: "panmykolai" },
  { id: "ven4oss", name: "ven4oss", nickname: "ven4oss", login: "ven4oss" },
  { id: "drita_no_bez_d", name: "drita_no_bez_d", nickname: "drita_no_bez_d", login: "drita_no_bez_d" },
  { id: "kuranvlad", name: "kuranvlad", nickname: "kuranvlad", login: "kuranvlad" },
  { id: "Tse_Jenya_i_Anya", name: "Tse_Jenya_i_Anya", nickname: "Tse_Jenya_i_Anya", login: "Tse_Jenya_i_Anya" },
  { id: "vtomleni", name: "vtomleni", nickname: "vtomleni", login: "vtomleni" },
  { id: "Olejandrooo", name: "Olejandrooo", nickname: "Olejandrooo", login: "Olejandrooo" },
  { id: "otolich", name: "otolich", nickname: "otolich", login: "otolich" },
  { id: "yunglenis", name: "yunglenis", nickname: "yunglenis", login: "yunglenis" },
  { id: "foxenkko", name: "foxenkko", nickname: "foxenkko", login: "foxenkko" },
  { id: "theoliviette", name: "theoliviette", nickname: "theoliviette", login: "theoliviette" },
  { id: "mxtokyo", name: "mxtokyo", nickname: "mxtokyo", login: "mxtokyo" },
  { id: "sviaks", name: "sviaks", nickname: "sviaks", login: "sviaks" },
  { id: "cyberkvitochka", name: "cyberkvitochka", nickname: "cyberkvitochka", login: "cyberkvitochka" },
  { id: "cakeislieee", name: "cakeislieee", nickname: "cakeislieee", login: "cakeislieee" },
  { id: "Volynyatko", name: "Volynyatko", nickname: "Volynyatko", login: "Volynyatko" },
  { id: "xaripso", name: "xaripso", nickname: "xaripso", login: "xaripso" },
  { id: "damnitskyi", name: "damnitskyi", nickname: "damnitskyi", login: "damnitskyi" },
  { id: "Kavalets", name: "Kavalets", nickname: "Kavalets", login: "Kavalets" },
  { id: "ssofikooooo", name: "ssofikooooo", nickname: "ssofikooooo", login: "ssofikooooo" },
  { id: "villanelle_9", name: "villanelle_9", nickname: "villanelle_9", login: "villanelle_9" },
  { id: "Daelon02", name: "Daelon02", nickname: "Daelon02", login: "Daelon02" },
  { id: "do_minat", name: "do_minat", nickname: "do_minat", login: "do_minat" },
  { id: "Pixie_itsme", name: "Pixie_itsme", nickname: "Pixie_itsme", login: "Pixie_itsme" },
  { id: "lilpersyk", name: "lilpersyk", nickname: "lilpersyk", login: "lilpersyk" },
  { id: "meawkalo", name: "meawkalo", nickname: "meawkalo", login: "meawkalo" },
  { id: "do3r1n", name: "do3r1n", nickname: "do3r1n", login: "do3r1n" },
  { id: "mr__brom", name: "mr__brom", nickname: "mr__brom", login: "mr__brom" },
  { id: "sundora", name: "sundora", nickname: "sundora", login: "sundora" },
  { id: "evgeniusd", name: "evgeniusd", nickname: "evgeniusd", login: "evgeniusd" },
  { id: "zdarovaotec112", name: "zdarovaotec112", nickname: "zdarovaotec112", login: "zdarovaotec112" },
  { id: "r0r1ch", name: "r0r1ch", nickname: "r0r1ch", login: "r0r1ch" },
  { id: "yourpovilitel", name: "yourpovilitel", nickname: "yourpovilitel", login: "yourpovilitel" },
  { id: "mariksa02", name: "mariksa02", nickname: "mariksa02", login: "mariksa02" }
];
const IRL_OF_THE_YEAR_NOMINEES = [
  { id: "do_minat", name: "do_minat", nickname: "do_minat", login: "do_minat" },
  { id: "aleksov", name: "aleksov", nickname: "aleksov", login: "aleksov" },
  { id: "missmartik", name: "missmartik", nickname: "missmartik", login: "missmartik" },
  { id: "difu3en", name: "difu3en", nickname: "difu3en", login: "difu3en" },
  { id: "blancooww", name: "blancooww", nickname: "blancooww", login: "blancooww" },
  { id: "thetremba", name: "TheTremba", nickname: "thetremba", login: "thetremba" },
  { id: "roolex9", name: "roolex9", nickname: "roolex9", login: "roolex9" },
  { id: "the_rich_texan", name: "the_rich_texan", nickname: "the_rich_texan", login: "the_rich_texan" },
  { id: "drita_no_bez_d", name: "drita_no_bez_d", nickname: "drita_no_bez_d", login: "drita_no_bez_d" },
  { id: "hevko0", name: "hevko0", nickname: "hevko0", login: "hevko0" },
  { id: "trener", name: "trener", nickname: "trener", login: "trener" },
  { id: "cusnee", name: "cusnee", nickname: "cusnee", login: "cusnee" },
  { id: "itsgolovna", name: "itsgolovna", nickname: "itsgolovna", login: "itsgolovna" },
  { id: "karus1k", name: "karus1k", nickname: "karus1k", login: "karus1k" },
  { id: "bilyiiii", name: "bilyiiii", nickname: "bilyiiii", login: "bilyiiii" },
  { id: "rpoxu", name: "rpoxu", nickname: "rpoxu", login: "rpoxu" },
  { id: "ukrsoulful", name: "ukrsoulful", nickname: "ukrsoulful", login: "ukrsoulful" }
];

const VTUBER_OF_THE_YEAR_NOMINEES = [
  { id: "kokosovakoza", name: "kokosovakoza", nickname: "kokosovakoza", login: "kokosovakoza" },
  { id: "mini_dara", name: "mini_dara", nickname: "mini_dara", login: "mini_dara" },
  { id: "luma_rum", name: "luma_rum", nickname: "luma_rum", login: "luma_rum" },
  { id: "ptizasinitsa", name: "ptizasinitsa", nickname: "ptizasinitsa", login: "ptizasinitsa" },
  { id: "fon_vt", name: "fon_vt", nickname: "fon_vt", login: "fon_vt" },
  { id: "mamura_senpai", name: "mamura_senpai", nickname: "mamura_senpai", login: "mamura_senpai" },
  { id: "madyfroggy", name: "madyfroggy", nickname: "madyfroggy", login: "madyfroggy" },
  { id: "ara_ara_arazuki", name: "ara_ara_arazuki", nickname: "ara_ara_arazuki", login: "ara_ara_arazuki" },
  { id: "margsaur", name: "margsaur", nickname: "margsaur", login: "margsaur" },
  { id: "Karmaliya", name: "Karmaliya", nickname: "Karmaliya", login: "Karmaliya" },
  { id: "kaori_vtuber", name: "kaori_vtuber", nickname: "kaori_vtuber", login: "kaori_vtuber" },
  { id: "dntude", name: "dntude", nickname: "dntude", login: "dntude" },
  { id: "Lady_Skeify", name: "Lady_Skeify", nickname: "Lady_Skeify", login: "Lady_Skeify" },
  { id: "merychan_kikoyo", name: "merychan_kikoyo", nickname: "merychan_kikoyo", login: "merychan_kikoyo" },
  { id: "rion_anya", name: "rion_anya", nickname: "rion_anya", login: "rion_anya" },
  { id: "ev1leye9", name: "ev1leye9", nickname: "ev1leye9", login: "ev1leye9" },
  { id: "h_o_r_b_e_l", name: "h_o_r_b_e_l", nickname: "h_o_r_b_e_l", login: "h_o_r_b_e_l" },
  { id: "asya_ua_vtuber", name: "asya_ua_vtuber", nickname: "asya_ua_vtuber", login: "asya_ua_vtuber" },
  { id: "AloriWinderer", name: "AloriWinderer", nickname: "AloriWinderer", login: "AloriWinderer" },
  { id: "fowie_chan", name: "fowie_chan", nickname: "fowie_chan", login: "fowie_chan" },
  { id: "e_wexy", name: "e_wexy", nickname: "e_wexy", login: "e_wexy" },
  { id: "wayllis", name: "wayllis", nickname: "wayllis", login: "wayllis" },
  { id: "velmira_astrid", name: "velmira_astrid", nickname: "velmira_astrid", login: "velmira_astrid" },
  { id: "2xmon", name: "2xmon", nickname: "2xmon", login: "2xmon" },
  { id: "annie_twi", name: "annie_twi", nickname: "annie_twi", login: "annie_twi" },
  { id: "liryvt", name: "liryvt", nickname: "liryvt", login: "liryvt" },
  { id: "amanenana", name: "amanenana", nickname: "amanenana", login: "amanenana" },
  { id: "kevelovek", name: "kevelovek", nickname: "kevelovek", login: "kevelovek" },
  { id: "marinade_vtuber", name: "marinade_vtuber", nickname: "marinade_vtuber", login: "marinade_vtuber" },
  { id: "nata_riya", name: "nata_riya", nickname: "nata_riya", login: "nata_riya" },
  { id: "atamankit", name: "atamankit", nickname: "atamankit", login: "atamankit" },
  { id: "dannyelgray", name: "dannyelgray", nickname: "dannyelgray", login: "dannyelgray" },
  { id: "luyorin", name: "luyorin", nickname: "luyorin", login: "luyorin" },
  { id: "felix_legion", name: "felix_legion", nickname: "felix_legion", login: "felix_legion" },
  { id: "admeka", name: "admeka", nickname: "admeka", login: "admeka" },
  { id: "aldo_vt", name: "aldo_vt", nickname: "aldo_vt", login: "aldo_vt" },
  { id: "ferxthebard", name: "ferxthebard", nickname: "ferxthebard", login: "ferxthebard" },
  { id: "yanakama07", name: "yanakama07", nickname: "yanakama07", login: "yanakama07" },
  { id: "fir_fi_", name: "fir_fi_", nickname: "fir_fi_", login: "fir_fi_" },
  { id: "hornyyoyi", name: "hornyyoyi", nickname: "hornyyoyi", login: "hornyyoyi" },
  { id: "pochyyaa", name: "pochyyaa", nickname: "pochyyaa", login: "pochyyaa" },
  { id: "green_fukuroy", name: "green_fukuroy", nickname: "green_fukuroy", login: "green_fukuroy" },
  { id: "333geramori", name: "333geramori", nickname: "333geramori", login: "333geramori" },
  { id: "amattoart", name: "amattoart", nickname: "amattoart", login: "amattoart" },
  { id: "blessed_blest", name: "blessed_blest", nickname: "blessed_blest", login: "blessed_blest" },
  { id: "shizi_kroc", name: "shizi_kroc", nickname: "shizi_kroc", login: "shizi_kroc" },
  { id: "niaboo_34", name: "niaboo_34", nickname: "niaboo_34", login: "niaboo_34" },
  { id: "umi_chi_umi", name: "umi_chi_umi", nickname: "umi_chi_umi", login: "umi_chi_umi" },
  { id: "panzavr", name: "panzavr", nickname: "panzavr", login: "panzavr" },
  { id: "archi_bones", name: "archi_bones", nickname: "archi_bones", login: "archi_bones" },
  { id: "kyoko_ua_vtuber", name: "kyoko_ua_vtuber", nickname: "kyoko_ua_vtuber", login: "kyoko_ua_vtuber" },
  { id: "nimuuue_", name: "nimuuue_", nickname: "nimuuue_", login: "nimuuue_" },
  { id: "himetyanart", name: "himetyanart", nickname: "himetyanart", login: "himetyanart" },
  { id: "akililpotato", name: "akililpotato", nickname: "akililpotato", login: "akililpotato" },
  { id: "aropixel", name: "aropixel", nickname: "aropixel", login: "aropixel" },
  { id: "kalendora", name: "kalendora", nickname: "kalendora", login: "kalendora" },
  { id: "bananium_", name: "bananium_", nickname: "bananium_", login: "bananium_" },
];
const CS_OF_THE_YEAR_NOMINEES = [
  { id: "masllory", name: "masllory", nickname: "masllory", login: "masllory" },
  { id: "astr0phytum", name: "astr0phytum", nickname: "astr0phytum", login: "astr0phytum" },
  { id: "fur0ske", name: "fur0ske", nickname: "fur0ske", login: "fur0ske" },
  { id: "yunglenis", name: "yunglenis", nickname: "yunglenis", login: "yunglenis" },
  { id: "olejandrooo", name: "olejandrooo", nickname: "olejandrooo", login: "olejandrooo" },
  { id: "smoky", name: "smoky", nickname: "smoky", login: "smoky" },
  { id: "zdarovaotec112", name: "zdarovaotec112", nickname: "zdarovaotec112", login: "zdarovaotec112" },
  { id: "Daelon02", name: "Daelon02", nickname: "Daelon02", login: "Daelon02" },
  { id: "lunarilunaa", name: "lunarilunaa", nickname: "lunarilunaa", login: "lunarilunaa" },
  { id: "1nsane_puncher", name: "1nsane_puncher", nickname: "1nsane_puncher", login: "1nsane_puncher" },
  { id: "guthriee", name: "guthriee", nickname: "guthriee", login: "guthriee" },
  { id: "tand1e", name: "tand1e", nickname: "tand1e", login: "tand1e" },
  { id: "aalinchikss", name: "aalinchikss", nickname: "aalinchikss", login: "aalinchikss" },
  { id: "turtle_silent", name: "turtle_silent", nickname: "turtle_silent", login: "turtle_silent" },
  { id: "thunder_oleg", name: "thunder_oleg", nickname: "thunder_oleg", login: "thunder_oleg" },
  { id: "valentinopradagucci", name: "valentinopradagucci", nickname: "valentinopradagucci", login: "valentinopradagucci" },
  { id: "xoxomka", name: "xoxomka", nickname: "xoxomka", login: "xoxomka" },
  { id: "fl1per4", name: "fl1per4", nickname: "fl1per4", login: "fl1per4" },
  { id: "milatnm", name: "milatnm", nickname: "milatnm", login: "milatnm" },
  { id: "simyton", name: "simyton", nickname: "simyton", login: "simyton" },
  { id: "kuaskiogb", name: "kuaskiogb", nickname: "kuaskiogb", login: "kuaskiogb" },
  { id: "pani_pypkaa", name: "pani_pypkaa", nickname: "pani_pypkaa", login: "pani_pypkaa" },
  { id: "tati_tv", name: "tati_tv", nickname: "tati_tv", login: "tati_tv" },
  { id: "deedoseetv", name: "deedoseetv", nickname: "deedoseetv", login: "deedoseetv" },
  { id: "leniniw", name: "leniniw", nickname: "leniniw", login: "leniniw" },
  { id: "zarikxx_", name: "zarikxx_", nickname: "zarikxx_", login: "zarikxx_" },
  { id: "minozavr", name: "minozavr", nickname: "minozavr", login: "minozavr" }
];
const DOTA_OF_THE_YEAR_NOMINEES = [
  { id: "taitake", name: "taitake", nickname: "taitake", login: "taitake" },
  { id: "dianosauric", name: "dianosauric", nickname: "dianosauric", login: "dianosauric" },
  { id: "ghostik", name: "ghostik", nickname: "ghostik", login: "ghostik" },
  { id: "totustop", name: "totustop", nickname: "totustop", login: "totustop" },
  { id: "doubleespresso", name: "doubleespresso", nickname: "doubleespresso", login: "doubleespresso" },
  { id: "rakuzan777", name: "rakuzan777", nickname: "rakuzan777", login: "rakuzan777" },
  { id: "belonytv", name: "belonytv", nickname: "belonytv", login: "belonytv" },
  { id: "lysychka_ri", name: "lysychka_ri", nickname: "lysychka_ri", login: "lysychka_ri" },
  { id: "bafik", name: "bafik", nickname: "bafik", login: "bafik" },
  { id: "jex_ua", name: "jex_ua", nickname: "jex_ua", login: "jex_ua" },
  { id: "janetty_y", name: "janetty_y", nickname: "janetty_y", login: "janetty_y" }
]
const GAMER_OF_THE_YEAR_NOMINEES = [
  { id: "atamankit", name: "atamankit", nickname: "atamankit", login: "atamankit" },
  { id: "astr0phytum", name: "astr0phytum", nickname: "astr0phytum", login: "astr0phytum" },
  { id: "slakesz", name: "slakesz", nickname: "slakesz", login: "slakesz" },
  { id: "annie_twi", name: "annie_twi", nickname: "annie_twi", login: "annie_twi" },
  { id: "panzavr", name: "panzavr", nickname: "panzavr", login: "panzavr" },
  { id: "d1vka", name: "d1vka", nickname: "d1vka", login: "d1vka" },
  { id: "velmira_astrid", name: "velmira_astrid", nickname: "velmira_astrid", login: "velmira_astrid" },
  { id: "asya_ua_vtuber", name: "asya_ua_vtuber", nickname: "asya_ua_vtuber", login: "asya_ua_vtuber" },
  { id: "fowie_chan", name: "fowie_chan", nickname: "fowie_chan", login: "fowie_chan" },
  { id: "pyvnyiflex", name: "pyvnyiflex", nickname: "pyvnyiflex", login: "pyvnyiflex" },
  { id: "fon_vt", name: "fon_vt", nickname: "fon_vt", login: "fon_vt" },
  { id: "TouchtheGeometry", name: "TouchtheGeometry", nickname: "TouchtheGeometry", login: "TouchtheGeometry" },
  { id: "morymukh", name: "morymukh", nickname: "morymukh", login: "morymukh" },
  { id: "twaryna", name: "twaryna", nickname: "twaryna", login: "twaryna" },
  { id: "wayllis", name: "wayllis", nickname: "wayllis", login: "wayllis" },
  { id: "liryvt", name: "liryvt", nickname: "liryvt", login: "liryvt" },
  { id: "sekhmet_dmn", name: "sekhmet_dmn", nickname: "sekhmet_dmn", login: "sekhmet_dmn" },
  { id: "deedoseetv", name: "deedoseetv", nickname: "deedoseetv", login: "deedoseetv" },
  { id: "mini_dara", name: "mini_dara", nickname: "mini_dara", login: "mini_dara" },
  { id: "amattoart", name: "amattoart", nickname: "amattoart", login: "amattoart" },
  { id: "akililpotato", name: "akililpotato", nickname: "akililpotato", login: "akililpotato" },
  { id: "zarikxx_", name: "zarikxx_", nickname: "zarikxx_", login: "zarikxx_" },
  { id: "truefalseplay", name: "truefalseplay", nickname: "truefalseplay", login: "truefalseplay" },
  { id: "kevelovek", name: "kevelovek", nickname: "kevelovek", login: "kevelovek" },
  { id: "polivalko", name: "polivalko", nickname: "polivalko", login: "polivalko" },
  { id: "yuzia_online", name: "yuzia_online", nickname: "yuzia_online", login: "yuzia_online" },
  { id: "lizetkaa", name: "lizetkaa", nickname: "lizetkaa", login: "lizetkaa" },
  { id: "milatnm", name: "milatnm", nickname: "milatnm", login: "milatnm" },
  { id: "ptizasinitsa", name: "ptizasinitsa", nickname: "ptizasinitsa", login: "ptizasinitsa" },
  { id: "kostianua", name: "kostianua", nickname: "kostianua", login: "kostianua" },
  { id: "thetremba", name: "TheTremba", nickname: "thetremba", login: "thetremba" },
  { id: "valentinopradagucci", name: "valentinopradagucci", nickname: "valentinopradagucci", login: "valentinopradagucci" },
  { id: "roolex9", name: "Roolex9", nickname: "roolex9", login: "roolex9" },
  { id: "ivonyak", name: "Ivonyak", nickname: "ivonyak", login: "ivonyak" },
  { id: "veron_khalepa", name: "veron_khalepa", nickname: "veron_khalepa", login: "veron_khalepa" },
  { id: "janetty_y", name: "janetty_y", nickname: "janetty_y", login: "janetty_y" },
  { id: "lavielay", name: "lavielay", nickname: "lavielay", login: "lavielay" },
  { id: "babooreh", name: "babooreh", nickname: "babooreh", login: "babooreh" },
  { id: "amanenana", name: "amanenana", nickname: "amanenana", login: "amanenana" },
  { id: "my_pivnich", name: "my_pivnich", nickname: "my_pivnich", login: "my_pivnich" },
  { id: "tvorchi_varenychky", name: "tvorchi_varenychky", nickname: "tvorchi_varenychky", login: "tvorchi_varenychky" },
  { id: "rat1bor", name: "rat1bor", nickname: "rat1bor", login: "rat1bor" },
  { id: "sonialimm", name: "sonialimm", nickname: "sonialimm", login: "sonialimm" },
  { id: "alinariuk", name: "alinariuk", nickname: "alinariuk", login: "alinariuk" },
  { id: "max_f1ne", name: "max_f1ne", nickname: "max_f1ne", login: "max_f1ne" },
  { id: "deviantsev", name: "deviantsev", nickname: "deviantsev", login: "deviantsev" },
  { id: "xaripso", name: "xaripso", nickname: "xaripso", login: "xaripso" },
  { id: "thejulles", name: "thejulles", nickname: "thejulles", login: "thejulles" },
  { id: "alex_lova", name: "alex_lova", nickname: "alex_lova", login: "alex_lova" },
  { id: "dobra_divka", name: "Dobra_Divka", nickname: "dobra_divka", login: "dobra_divka" },
  { id: "1ankor", name: "1ankor", nickname: "1ankor", login: "1ankor" },
  { id: "cyberkvitochka", name: "cyberkvitochka", nickname: "cyberkvitochka", login: "cyberkvitochka" },
  { id: "1nsane_puncher", name: "1nsane_puncher", nickname: "1nsane_puncher", login: "1nsane_puncher" },
  { id: "maaaaarriiiii", name: "maaaaarriiiii", nickname: "maaaaarriiiii", login: "maaaaarriiiii" },
  { id: "olejneolej", name: "olejneolej", nickname: "olejneolej", login: "olejneolej" },
  { id: "pankraatik", name: "pankraatik", nickname: "pankraatik", login: "pankraatik" },
  { id: "pask3vych", name: "pask3vych", nickname: "pask3vych", login: "pask3vych" },
  { id: "slippeua", name: "slippeua", nickname: "slippeua", login: "slippeua" },
  { id: "airkurgan", name: "airkurgan", nickname: "airkurgan", login: "airkurgan" },
  { id: "zdarovaotec112", name: "zdarovaotec112", nickname: "zdarovaotec112", login: "zdarovaotec112" },
  { id: "quarryck", name: "quarryck", nickname: "quarryck", login: "quarryck" },
  { id: "krapkacoma", name: "krapkacoma", nickname: "krapkacoma", login: "krapkacoma" },
  { id: "theoliviette", name: "theoliviette", nickname: "theoliviette", login: "theoliviette" },
  { id: "smoky", name: "smoky", nickname: "smoky", login: "smoky" },
  { id: "skevich_", name: "skevich_", nickname: "skevich_", login: "skevich_" },
  { id: "sss0li", name: "sss0li", nickname: "sss0li", login: "sss0li" },
  { id: "mxtokyo", name: "mxtokyo", nickname: "mxtokyo", login: "mxtokyo" },
  { id: "casuscloud", name: "casuscloud", nickname: "casuscloud", login: "casuscloud" },
  { id: "nazaretto333", name: "nazaretto333", nickname: "nazaretto333", login: "nazaretto333" },
  { id: "kuaskiogb", name: "kuaskiogb", nickname: "kuaskiogb", login: "kuaskiogb" },
  { id: "icepepepopusk", name: "icepepepopusk", nickname: "icepepepopusk", login: "icepepepopusk" },
  { id: "olejandrooo", name: "olejandrooo", nickname: "olejandrooo", login: "olejandrooo" },
  { id: "bdjolenya", name: "bdjolenya", nickname: "bdjolenya", login: "bdjolenya" },
  { id: "allidarsu", name: "allidarsu", nickname: "allidarsu", login: "allidarsu" },
  { id: "milaaha", name: "milaaha", nickname: "milaaha", login: "milaaha" },
  { id: "link2k", name: "link2k", nickname: "link2k", login: "link2k" },
  { id: "bigpigboss_", name: "bigpigboss_", nickname: "bigpigboss_", login: "bigpigboss_" },
  { id: "solodana", name: "solodana", nickname: "solodana", login: "solodana" },
  { id: "zombakua", name: "zombakua", nickname: "zombakua", login: "zombakua" },
  { id: "yunglenis", name: "yunglenis", nickname: "yunglenis", login: "yunglenis" },
  { id: "taitake", name: "taitake", nickname: "taitake", login: "taitake" },
  { id: "pixelfedya", name: "pixelfedya", nickname: "pixelfedya", login: "pixelfedya" },
  { id: "meditation_ua", name: "meditation_ua", nickname: "meditation_ua", login: "meditation_ua" },
  { id: "adult_woman", name: "adult_woman", nickname: "adult_woman", login: "adult_woman" },
  { id: "connor_qq", name: "connor_qq", nickname: "connor_qq", login: "connor_qq" },
  { id: "doubleespresso", name: "doubleespresso", nickname: "doubleespresso", login: "doubleespresso" },
  { id: "fur0ske", name: "fur0ske", nickname: "fur0ske", login: "fur0ske" },
  { id: "ghostik", name: "ghostik", nickname: "ghostik", login: "ghostik" },
  { id: "juggua", name: "juggua", nickname: "juggua", login: "juggua" },
  { id: "artone619", name: "artone619", nickname: "artone619", login: "artone619" },
  { id: "lusty_dog", name: "lusty_dog", nickname: "lusty_dog", login: "lusty_dog" },
  { id: "usachman", name: "usachman", nickname: "usachman", login: "usachman" },
  { id: "r0r1ch", name: "r0r1ch", nickname: "r0r1ch", login: "r0r1ch" },
  { id: "yori1k", name: "yori1k", nickname: "yori1k", login: "yori1k" },
  { id: "pol0nskyi", name: "pol0nskyi", nickname: "pol0nskyi", login: "pol0nskyi" },
  { id: "radioboyo", name: "radioboyo", nickname: "radioboyo", login: "radioboyo" },
  { id: "olehovychtut", name: "olehovychtut", nickname: "olehovychtut", login: "olehovychtut" },
  { id: "malzaharberkut", name: "malzaharberkut", nickname: "malzaharberkut", login: "malzaharberkut" },
  { id: "v0ltm4n", name: "v0ltm4n", nickname: "v0ltm4n", login: "v0ltm4n" },
  { id: "itsmoysha", name: "itsmoysha", nickname: "itsmoysha", login: "itsmoysha" },
  { id: "mrsilly_boy", name: "mrsilly_boy", nickname: "mrsilly_boy", login: "mrsilly_boy" },
  { id: "mr__brom", name: "mr__brom", nickname: "mr__brom", login: "mr__brom" },
  { id: "fl1per4", name: "fl1per4", nickname: "fl1per4", login: "fl1per4" },
  { id: "umi_chi_umi", name: "umi_chi_umi", nickname: "umi_chi_umi", login: "umi_chi_umi" },
  { id: "masllory", name: "masllory", nickname: "masllory", login: "masllory" },
  { id: "ringoua", name: "ringoua", nickname: "ringoua", login: "ringoua" },
  { id: "aloriwinderer", name: "aloriwinderer", nickname: "aloriwinderer", login: "aloriwinderer" },
  { id: "marinade_vtuber", name: "marinade_vtuber", nickname: "marinade_vtuber", login: "marinade_vtuber" },
  { id: "luma_rum", name: "luma_rum", nickname: "luma_rum", login: "luma_rum" },
  { id: "vtomleni", name: "vtomleni", nickname: "vtomleni", login: "vtomleni" },
  { id: "minozavr", name: "minozavr", nickname: "minozavr", login: "minozavr" },
  { id: "Daelon02", name: "Daelon02", nickname: "Daelon02", login: "Daelon02" },
  { id: "leniniw", name: "leniniw", nickname: "leniniw", login: "leniniw" },
  { id: "ceh9", name: "ceh9", nickname: "ceh9", login: "ceh9" },
  { id: "harris_0ne", name: "harris_0ne", nickname: "harris_0ne", login: "harris_0ne" },
  { id: "deko6", name: "deko6", nickname: "deko6", login: "deko6" },
  { id: "tonymontony", name: "tonymontony", nickname: "tonymontony", login: "tonymontony" },
  { id: "token", name: "token", nickname: "token", login: "token" },
  { id: "bananium_", name: "bananium_", nickname: "bananium_", login: "bananium_" },
  { id: "archi_bones", name: "archi_bones", nickname: "archi_bones", login: "archi_bones" },
  { id: "moon_sanik", name: "moon_sanik", nickname: "moon_sanik", login: "moon_sanik" },
  { id: "pani_pypkaa", name: "pani_pypkaa", nickname: "pani_pypkaa", login: "pani_pypkaa" },
  { id: "rolik33", name: "rolik33", nickname: "rolik33", login: "rolik33" }
]
const ALL_OF_THE_YEAR_NOMINEES = [
  { id: "evgeniusd", name: "evgeniusd", nickname: "evgeniusd", login: "evgeniusd" },
  { id: "malzaharberkut", name: "malzaharberkut", nickname: "malzaharberkut", login: "malzaharberkut" },
  { id: "ferxthebard", name: "ferxthebard", nickname: "ferxthebard", login: "ferxthebard" },
  { id: "nimuuue_", name: "nimuuue_", nickname: "nimuuue_", login: "nimuuue_" },
  { id: "velmira_astrid", name: "velmira_astrid", nickname: "velmira_astrid", login: "velmira_astrid" },
  { id: "amanenana", name: "amanenana", nickname: "amanenana", login: "amanenana" },
  { id: "tisonechko", name: "tisonechko", nickname: "tisonechko", login: "tisonechko" },
  { id: "d1vka", name: "d1vka", nickname: "d1vka", login: "d1vka" },
  { id: "umi_chi_umi", name: "umi_chi_umi", nickname: "umi_chi_umi", login: "umi_chi_umi" },
  { id: "lysychka_ri", name: "lysychka_ri", nickname: "lysychka_ri", login: "lysychka_ri" },
  { id: "crymii_", name: "crymii_", nickname: "crymii_", login: "crymii_" },
  { id: "2xmon", name: "2xmon", nickname: "2xmon", login: "2xmon" },
  { id: "kuaskiogb", name: "kuaskiogb", nickname: "kuaskiogb", login: "kuaskiogb" },
  { id: "lizlovenni", name: "lizlovenni", nickname: "lizlovenni", login: "lizlovenni" },
  { id: "h_o_r_b_e_l", name: "h_o_r_b_e_l", nickname: "h_o_r_b_e_l", login: "h_o_r_b_e_l" },
  { id: "kaori_vtuber", name: "kaori_vtuber", nickname: "kaori_vtuber", login: "kaori_vtuber" },
  { id: "TouchtheGeometry", name: "TouchtheGeometry", nickname: "TouchtheGeometry", login: "TouchtheGeometry" },
  { id: "pyvnyiflex", name: "pyvnyiflex", nickname: "pyvnyiflex", login: "pyvnyiflex" },
  { id: "ptizasinitsa", name: "ptizasinitsa", nickname: "ptizasinitsa", login: "ptizasinitsa" },
  { id: "lilpersyk", name: "lilpersyk", nickname: "lilpersyk", login: "lilpersyk" },
  { id: "wayllis", name: "wayllis", nickname: "wayllis", login: "wayllis" },
  { id: "niaboo_34", name: "niaboo_34", nickname: "niaboo_34", login: "niaboo_34" },
  { id: "madyfroggy", name: "madyfroggy", nickname: "madyfroggy", login: "madyfroggy" },
  { id: "hornyyoyi", name: "hornyyoyi", nickname: "hornyyoyi", login: "hornyyoyi" },
  { id: "ara_ara_arazuki", name: "ara_ara_arazuki", nickname: "ara_ara_arazuki", login: "ara_ara_arazuki" },
  { id: "luyorin", name: "luyorin", nickname: "luyorin", login: "luyorin" },
  { id: "bananium_", name: "bananium_", nickname: "bananium_", login: "bananium_" },
  { id: "333geramori", name: "333geramori", nickname: "333geramori", login: "333geramori" },
  { id: "merychan_kikoyo", name: "merychan_kikoyo", nickname: "merychan_kikoyo", login: "merychan_kikoyo" },
  { id: "amattoart", name: "amattoart", nickname: "amattoart", login: "amattoart" },
  { id: "ev1leye9", name: "ev1leye9", nickname: "ev1leye9", login: "ev1leye9" },
  { id: "mini_dara", name: "mini_dara", nickname: "mini_dara", login: "mini_dara" },
  { id: "asya_ua_vtuber", name: "asya_ua_vtuber", nickname: "asya_ua_vtuber", login: "asya_ua_vtuber" },
  { id: "dntude", name: "dntude", nickname: "dntude", login: "dntude" },
  { id: "fowie_chan", name: "fowie_chan", nickname: "fowie_chan", login: "fowie_chan" },
  { id: "kyoko_ua_vtuber", name: "kyoko_ua_vtuber", nickname: "kyoko_ua_vtuber", login: "kyoko_ua_vtuber" },
  { id: "e_wexy", name: "e_wexy", nickname: "e_wexy", login: "e_wexy" },
  { id: "rion_anya", name: "rion_anya", nickname: "rion_anya", login: "rion_anya" },
  { id: "rolik33", name: "rolik33", nickname: "rolik33", login: "rolik33" },
  { id: "fon_vt", name: "fon_vt", nickname: "fon_vt", login: "fon_vt" },
  { id: "liryvt", name: "liryvt", nickname: "liryvt", login: "liryvt" },
  { id: "panzavr", name: "panzavr", nickname: "panzavr", login: "panzavr" },
  { id: "jane_inglasses", name: "jane_inglasses", nickname: "jane_inglasses", login: "jane_inglasses" },
  { id: "sundora", name: "sundora", nickname: "sundora", login: "sundora" },
  { id: "annie_twi", name: "annie_twi", nickname: "annie_twi", login: "annie_twi" },
  { id: "astr0phytum", name: "astr0phytum", nickname: "astr0phytum", login: "astr0phytum" },
  { id: "mijulsss", name: "mijulsss", nickname: "mijulsss", login: "mijulsss" },
  { id: "stefrudy", name: "stefrudy", nickname: "stefrudy", login: "stefrudy" },
  { id: "pani_pypkaa", name: "pani_pypkaa", nickname: "pani_pypkaa", login: "pani_pypkaa" },
  { id: "slakesz", name: "slakesz", nickname: "slakesz", login: "slakesz" },
  { id: "felix_legion", name: "felix_legion", nickname: "felix_legion", login: "felix_legion" },
  { id: "kostianua", name: "kostianua", nickname: "kostianua", login: "kostianua" },
  { id: "kostikovna", name: "kostikovna", nickname: "kostikovna", login: "kostikovna" },
  { id: "token", name: "token", nickname: "token", login: "token" },
  { id: "aropixel", name: "aropixel", nickname: "aropixel", login: "aropixel" },
  { id: "green_fukuroy", name: "green_fukuroy", nickname: "green_fukuroy", login: "green_fukuroy" },
  { id: "truefalseplay", name: "truefalseplay", nickname: "truefalseplay", login: "truefalseplay" },
  { id: "t0temka", name: "t0temka", nickname: "t0temka", login: "t0temka" },
  { id: "morymukh", name: "morymukh", nickname: "morymukh", login: "morymukh" },
  { id: "zarikxx_", name: "zarikxx_", nickname: "zarikxx_", login: "zarikxx_" },
  { id: "deedoseetv", name: "deedoseetv", nickname: "deedoseetv", login: "deedoseetv" },
  { id: "twaryna", name: "twaryna", nickname: "twaryna", login: "twaryna" },
  { id: "tati_tv", name: "tati_tv", nickname: "tati_tv", login: "tati_tv" },
  { id: "bigpigboss_", name: "bigpigboss_", nickname: "bigpigboss_", login: "bigpigboss_" },
  { id: "akililpotato", name: "akililpotato", nickname: "akililpotato", login: "akililpotato" },
  { id: "stervo_", name: "stervo_", nickname: "stervo_", login: "stervo_" },
  { id: "sekhmet_dmn", name: "sekhmet_dmn", nickname: "sekhmet_dmn", login: "sekhmet_dmn" },
  { id: "polivalko", name: "polivalko", nickname: "polivalko", login: "polivalko" },
  { id: "yuzia_online", name: "yuzia_online", nickname: "yuzia_online", login: "yuzia_online" },
  { id: "margsaur", name: "margsaur", nickname: "margsaur", login: "margsaur" },
  { id: "yourpovilitel", name: "yourpovilitel", nickname: "yourpovilitel", login: "yourpovilitel" },
  { id: "trener", name: "trener", nickname: "trener", login: "trener" },
  { id: "atamankit", name: "atamankit", nickname: "atamankit", login: "atamankit" },
  { id: "lizetkaa", name: "lizetkaa", nickname: "lizetkaa", login: "lizetkaa" },
  { id: "milatnm", name: "milatnm", nickname: "milatnm", login: "milatnm" },
  { id: "leb1ga", name: "Leb1ga", nickname: "leb1ga", login: "leb1ga" },
  { id: "thetremba", name: "TheTremba", nickname: "thetremba", login: "thetremba" },
  { id: "valentinopradagucci", name: "valentinopradagucci", nickname: "valentinopradagucci", login: "valentinopradagucci" },
  { id: "roolex9", name: "Roolex9", nickname: "roolex9", login: "roolex9" },
  { id: "missmartik", name: "missmartik", nickname: "missmartik", login: "missmartik" },
  { id: "ivonyak", name: "Ivonyak", nickname: "ivonyak", login: "ivonyak" },
  { id: "veron_khalepa", name: "veron_khalepa", nickname: "veron_khalepa", login: "veron_khalepa" },
  { id: "calypsopaw", name: "calypsopaw", nickname: "calypsopaw", login: "calypsopaw" },
  { id: "itsgolovna", name: "itsgolovna", nickname: "itsgolovna", login: "itsgolovna" },
  { id: "nyavka", name: "nyavka", nickname: "nyavka", login: "nyavka" },
  { id: "riomyri", name: "riomyri", nickname: "riomyri", login: "riomyri" },
  { id: "maryashik", name: "maryashik", nickname: "maryashik", login: "maryashik" },
  { id: "janetty_y", name: "janetty_y", nickname: "janetty_y", login: "janetty_y" },
  { id: "moonosya", name: "moonosya", nickname: "moonosya", login: "moonosya" },
  { id: "sheisfoxy", name: "sheisfoxy", nickname: "sheisfoxy", login: "sheisfoxy" },
  { id: "totoykaa", name: "totoykaa", nickname: "totoykaa", login: "totoykaa" },
  { id: "qwertyrra", name: "qwertyrra", nickname: "qwertyrra", login: "qwertyrra" },
  { id: "lavielay", name: "lavielay", nickname: "lavielay", login: "lavielay" },
  { id: "olsior", name: "Olsior", nickname: "olsior", login: "olsior" },
  { id: "babooreh", name: "babooreh", nickname: "babooreh", login: "babooreh" },
  { id: "my_pivnich", name: "my_pivnich", nickname: "my_pivnich", login: "my_pivnich" },
  { id: "tvorchi_varenychky", name: "tvorchi_varenychky", nickname: "tvorchi_varenychky", login: "tvorchi_varenychky" },
  { id: "cusnee", name: "cusnee", nickname: "cusnee", login: "cusnee" },
  { id: "akyulia", name: "akyulia", nickname: "akyulia", login: "akyulia" },
  { id: "rat1bor", name: "rat1bor", nickname: "rat1bor", login: "rat1bor" },
  { id: "sonialimm", name: "sonialimm", nickname: "sonialimm", login: "sonialimm" },
  { id: "lidusik_more", name: "lidusik_more", nickname: "lidusik_more", login: "lidusik_more" },
  { id: "ukrsoulful", name: "ukrsoulful", nickname: "ukrsoulful", login: "ukrsoulful" },
  { id: "the_rich_texan", name: "the_rich_texan", nickname: "the_rich_texan", login: "the_rich_texan" },
  { id: "alinariuk", name: "alinariuk", nickname: "alinariuk", login: "alinariuk" },
  { id: "max_f1ne", name: "max_f1ne", nickname: "max_f1ne", login: "max_f1ne" },
  { id: "deviantsev", name: "deviantsev", nickname: "deviantsev", login: "deviantsev" },
  { id: "xaripso", name: "xaripso", nickname: "xaripso", login: "xaripso" },
  { id: "thejulles", name: "thejulles", nickname: "thejulles", login: "thejulles" },
  { id: "alex_lova", name: "alex_lova", nickname: "alex_lova", login: "alex_lova" },
  { id: "dobra_divka", name: "Dobra_Divka", nickname: "dobra_divka", login: "dobra_divka" },
  { id: "1ankor", name: "1ankor", nickname: "1ankor", login: "1ankor" },
  { id: "hevko0", name: "hevko0", nickname: "hevko0", login: "hevko0" },
  { id: "recooniii", name: "recooniii", nickname: "recooniii", login: "recooniii" },
  { id: "cyberkvitochka", name: "cyberkvitochka", nickname: "cyberkvitochka", login: "cyberkvitochka" },
  { id: "1nsane_puncher", name: "1nsane_puncher", nickname: "1nsane_puncher", login: "1nsane_puncher" },
  { id: "maaaaarriiiii", name: "maaaaarriiiii", nickname: "maaaaarriiiii", login: "maaaaarriiiii" },
  { id: "olejneolej", name: "olejneolej", nickname: "olejneolej", login: "olejneolej" },
  { id: "nerzhaviyka", name: "nerzhaviyka", nickname: "nerzhaviyka", login: "nerzhaviyka" },
  { id: "pankraatik", name: "pankraatik", nickname: "pankraatik", login: "pankraatik" },
  { id: "c1dol3mm", name: "c1dol3mm", nickname: "c1dol3mm", login: "c1dol3mm" },
  { id: "kuzhel_", name: "kuzhel_", nickname: "kuzhel_", login: "kuzhel_" },
  { id: "pask3vych", name: "pask3vych", nickname: "pask3vych", login: "pask3vych" },
  { id: "otolich", name: "otolich", nickname: "otolich", login: "otolich" },
  { id: "verholaa", name: "verholaa", nickname: "verholaa", login: "verholaa" },
  { id: "nasty_cringe", name: "nasty_cringe", nickname: "nasty_cringe", login: "nasty_cringe" },
  { id: "bar_ozzi", name: "bar_ozzi", nickname: "bar_ozzi", login: "bar_ozzi" },
  { id: "foxenkko", name: "foxenkko", nickname: "foxenkko", login: "foxenkko" },
  { id: "do3r1n", name: "do3r1n", nickname: "do3r1n", login: "do3r1n" },
  { id: "zmiu_shka", name: "zmiu_shka", nickname: "zmiu_shka", login: "zmiu_shka" },
  { id: "lunarilunaa", name: "lunarilunaa", nickname: "lunarilunaa", login: "lunarilunaa" },
  { id: "slippeua", name: "slippeua", nickname: "slippeua", login: "slippeua" },
  { id: "airkurgan", name: "airkurgan", nickname: "airkurgan", login: "airkurgan" },
  { id: "zdarovaotec112", name: "zdarovaotec112", nickname: "zdarovaotec112", login: "zdarovaotec112" },
  { id: "quarryck", name: "quarryck", nickname: "quarryck", login: "quarryck" },
  { id: "krapkacoma", name: "krapkacoma", nickname: "krapkacoma", login: "krapkacoma" },
  { id: "theoliviette", name: "theoliviette", nickname: "theoliviette", login: "theoliviette" },
  { id: "smoky", name: "smoky", nickname: "smoky", login: "smoky" },
  { id: "itismirai", name: "itismirai", nickname: "itismirai", login: "itismirai" },
  { id: "skevich_", name: "skevich_", nickname: "skevich_", login: "skevich_" },
  { id: "drita_no_bez_d", name: "drita_no_bez_d", nickname: "drita_no_bez_d", login: "drita_no_bez_d" },
  { id: "sss0li", name: "sss0li", nickname: "sss0li", login: "sss0li" },
  { id: "aleksov", name: "aleksov", nickname: "aleksov", login: "aleksov" },
  { id: "solid_goodstone", name: "solid_goodstone", nickname: "solid_goodstone", login: "solid_goodstone" },
  { id: "mxtokyo", name: "mxtokyo", nickname: "mxtokyo", login: "mxtokyo" },
  { id: "pixie_itsme", name: "pixie_itsme", nickname: "pixie_itsme", login: "pixie_itsme" },
  { id: "volynyatko", name: "volynyatko", nickname: "volynyatko", login: "volynyatko" },
  { id: "nastya_patsiuk", name: "nastya_patsiuk", nickname: "nastya_patsiuk", login: "nastya_patsiuk" },
  { id: "ssofikooooo", name: "ssofikooooo", nickname: "ssofikooooo", login: "ssofikooooo" },
  { id: "casuscloud", name: "casuscloud", nickname: "casuscloud", login: "casuscloud" },
  { id: "nazaretto333", name: "nazaretto333", nickname: "nazaretto333", login: "nazaretto333" },
  { id: "rpoxu", name: "rpoxu", nickname: "rpoxu", login: "rpoxu" },
  { id: "icepepepopusk", name: "icepepepopusk", nickname: "icepepepopusk", login: "icepepepopusk" },
  { id: "difu3en", name: "difu3en", nickname: "difu3en", login: "difu3en" },
  { id: "olejandrooo", name: "olejandrooo", nickname: "olejandrooo", login: "olejandrooo" },
  { id: "bdjolenya", name: "bdjolenya", nickname: "bdjolenya", login: "bdjolenya" },
  { id: "tse_jenya_i_anya", name: "tse_jenya_i_anya", nickname: "tse_jenya_i_anya", login: "tse_jenya_i_anya" },
  { id: "kuranvlad", name: "kuranvlad", nickname: "kuranvlad", login: "kuranvlad" },
  { id: "ven4oss", name: "ven4oss", nickname: "ven4oss", login: "ven4oss" },
  { id: "allidarsu", name: "allidarsu", nickname: "allidarsu", login: "allidarsu" },
  { id: "link2k", name: "link2k", nickname: "link2k", login: "link2k" },
  { id: "solodana", name: "solodana", nickname: "solodana", login: "solodana" },
  { id: "zombakua", name: "zombakua", nickname: "zombakua", login: "zombakua" },
  { id: "yunglenis", name: "yunglenis", nickname: "yunglenis", login: "yunglenis" },
  { id: "taitake", name: "taitake", nickname: "taitake", login: "taitake" },
  { id: "roki_sid", name: "roki_sid", nickname: "roki_sid", login: "roki_sid" },
  { id: "pixelfedya", name: "pixelfedya", nickname: "pixelfedya", login: "pixelfedya" },
  { id: "oryblabla", name: "oryblabla", nickname: "oryblabla", login: "oryblabla" },
  { id: "meditation_ua", name: "meditation_ua", nickname: "meditation_ua", login: "meditation_ua" },
  { id: "adult_woman", name: "adult_woman", nickname: "adult_woman", login: "adult_woman" },
  { id: "cleyrey", name: "cleyrey", nickname: "cleyrey", login: "cleyrey" },
  { id: "connor_qq", name: "connor_qq", nickname: "connor_qq", login: "connor_qq" },
  { id: "depressedcatss", name: "depressedcatss", nickname: "depressedcatss", login: "depressedcatss" },
  { id: "doubleespresso", name: "doubleespresso", nickname: "doubleespresso", login: "doubleespresso" },
  { id: "dramacat", name: "dramacat", nickname: "dramacat", login: "dramacat" },
  { id: "fur0ske", name: "fur0ske", nickname: "fur0ske", login: "fur0ske" },
  { id: "ghostik", name: "ghostik", nickname: "ghostik", login: "ghostik" },
  { id: "grudnevaaa", name: "grudnevaaa", nickname: "grudnevaaa", login: "grudnevaaa" },
  { id: "juggua", name: "juggua", nickname: "juggua", login: "juggua" },
  { id: "artone619", name: "artone619", nickname: "artone619", login: "artone619" },
  { id: "blockbaby_4eal", name: "blockbaby_4eal", nickname: "blockbaby_4eal", login: "blockbaby_4eal" },
  { id: "did_shinobi", name: "did_shinobi", nickname: "did_shinobi", login: "did_shinobi" },
  { id: "lusty_dog", name: "lusty_dog", nickname: "lusty_dog", login: "lusty_dog" },
  { id: "spacemanlive", name: "spacemanlive", nickname: "spacemanlive", login: "spacemanlive" },
  { id: "usachman", name: "usachman", nickname: "usachman", login: "usachman" },
  { id: "r0r1ch", name: "r0r1ch", nickname: "r0r1ch", login: "r0r1ch" },
  { id: "moreabsurdy", name: "moreabsurdy", nickname: "moreabsurdy", login: "moreabsurdy" },
  { id: "evil_kaya", name: "evil_kaya", nickname: "evil_kaya", login: "evil_kaya" },
  { id: "yori1k", name: "yori1k", nickname: "yori1k", login: "yori1k" },
  { id: "pol0nskyi", name: "pol0nskyi", nickname: "pol0nskyi", login: "pol0nskyi" },
  { id: "radioboyo", name: "radioboyo", nickname: "radioboyo", login: "radioboyo" },
  { id: "olehovychtut", name: "olehovychtut", nickname: "olehovychtut", login: "olehovychtut" },
  { id: "v0ltm4n", name: "v0ltm4n", nickname: "v0ltm4n", login: "v0ltm4n" },
  { id: "kavalets", name: "kavalets", nickname: "kavalets", login: "kavalets" },
  { id: "dmytro_tyutyun", name: "dmytro_tyutyun", nickname: "dmytro_tyutyun", login: "dmytro_tyutyun" },
  { id: "kharkivets", name: "kharkivets", nickname: "kharkivets", login: "kharkivets" },
  { id: "itsmoysha", name: "itsmoysha", nickname: "itsmoysha", login: "itsmoysha" },
  { id: "nimbleem", name: "nimbleem", nickname: "nimbleem", login: "nimbleem" },
  { id: "aaavrora", name: "aaavrora", nickname: "aaavrora", login: "aaavrora" },
  { id: "dasha_hahaa", name: "dasha_hahaa", nickname: "dasha_hahaa", login: "dasha_hahaa" },
  { id: "mrsilly_boy", name: "mrsilly_boy", nickname: "mrsilly_boy", login: "mrsilly_boy" },
  { id: "mr__brom", name: "mr__brom", nickname: "mr__brom", login: "mr__brom" },
  { id: "masllory", name: "masllory", nickname: "masllory", login: "masllory" },
  { id: "bar_cy4ok", name: "bar_cy4ok", nickname: "bar_cy4ok", login: "bar_cy4ok" },
  { id: "ringoua", name: "ringoua", nickname: "ringoua", login: "ringoua" },
  { id: "dedofu", name: "dedofu", nickname: "dedofu", login: "dedofu" },
  { id: "aloriwinderer", name: "aloriwinderer", nickname: "aloriwinderer", login: "aloriwinderer" },
  { id: "marinade_vtuber", name: "marinade_vtuber", nickname: "marinade_vtuber", login: "marinade_vtuber" },
  { id: "luma_rum", name: "luma_rum", nickname: "luma_rum", login: "luma_rum" },
  { id: "didusyk", name: "didusyk", nickname: "didusyk", login: "didusyk" },
  { id: "vtomleni", name: "vtomleni", nickname: "vtomleni", login: "vtomleni" },
  { id: "helliaska", name: "helliaska", nickname: "helliaska", login: "helliaska" },
  { id: "minozavr", name: "minozavr", nickname: "minozavr", login: "minozavr" },
  { id: "turtle_silent", name: "turtle_silent", nickname: "turtle_silent", login: "turtle_silent" },
  { id: "lodianyk", name: "lodianyk", nickname: "lodianyk", login: "lodianyk" },
  { id: "yunvi_", name: "yunvi_", nickname: "yunvi_", login: "yunvi_" },
  { id: "xoxomka", name: "xoxomka", nickname: "xoxomka", login: "xoxomka" },
  { id: "kokosovakoza", name: "kokosovakoza", nickname: "kokosovakoza", login: "kokosovakoza" },
  { id: "NeTaneToy", name: "NeTaneToy", nickname: "NeTaneToy", login: "NeTaneToy" },
  { id: "panmykolai", name: "panmykolai", nickname: "panmykolai", login: "panmykolai" },
  { id: "sviaks", name: "sviaks", nickname: "sviaks", login: "sviaks" },
  { id: "cakeislieee", name: "cakeislieee", nickname: "cakeislieee", login: "cakeislieee" },
  { id: "damnitskyi", name: "damnitskyi", nickname: "damnitskyi", login: "damnitskyi" },
  { id: "villanelle_9", name: "villanelle_9", nickname: "villanelle_9", login: "villanelle_9" },
  { id: "Daelon02", name: "Daelon02", nickname: "Daelon02", login: "Daelon02" },
  { id: "kalendora", name: "kalendora", nickname: "kalendora", login: "kalendora" },
  { id: "do_minat", name: "do_minat", nickname: "do_minat", login: "do_minat" },
  { id: "pavloviypp", name: "pavloviypp", nickname: "pavloviypp", login: "pavloviypp" },
  { id: "leniniw", name: "leniniw", nickname: "leniniw", login: "leniniw" },
  { id: "ceh9", name: "ceh9", nickname: "ceh9", login: "ceh9" },
  { id: "rak_cheburak", name: "rak_cheburak", nickname: "rak_cheburak", login: "rak_cheburak" },
  { id: "deko6", name: "deko6", nickname: "deko6", login: "deko6" },
  { id: "skalii_", name: "skalii_", nickname: "skalii_", login: "skalii_" },
  { id: "aldo_vt", name: "aldo_vt", nickname: "aldo_vt", login: "aldo_vt" },
  { id: "yanakama07", name: "yanakama07", nickname: "yanakama07", login: "yanakama07" },
  { id: "fir_fi_", name: "fir_fi_", nickname: "fir_fi_", login: "fir_fi_" },
  { id: "blessed_blest", name: "blessed_blest", nickname: "blessed_blest", login: "blessed_blest" },
  { id: "shizi_kroc", name: "shizi_kroc", nickname: "shizi_kroc", login: "shizi_kroc" },
  { id: "himetyanart", name: "himetyanart", nickname: "himetyanart", login: "himetyanart" },
  { id: "tonymontony", name: "tonymontony", nickname: "tonymontony", login: "tonymontony" },
  { id: "dannyelgray", name: "dannyelgray", nickname: "dannyelgray", login: "dannyelgray" },
  { id: "pochyyaa", name: "pochyyaa", nickname: "pochyyaa", login: "pochyyaa" },
  { id: "potishka", name: "potishka", nickname: "potishka", login: "potishka" },
  { id: "deneti_mi", name: "deneti_mi", nickname: "deneti_mi", login: "deneti_mi" },
  { id: "harris_0ne", name: "harris_0ne", nickname: "harris_0ne", login: "harris_0ne" },
  { id: "admeka", name: "admeka", nickname: "admeka", login: "admeka" },
  { id: "moon_sanik", name: "moon_sanik", nickname: "moon_sanik", login: "moon_sanik" },
  { id: "archi_bones", name: "archi_bones", nickname: "archi_bones", login: "archi_bones" },
  { id: "tsivak", name: "tsivak", nickname: "tsivak", login: "tsivak" },
  { id: "fl1per4", name: "fl1per4", nickname: "fl1per4", login: "fl1per4" },
  { id: "netremba", name: "netremba", nickname: "netremba", login: "netremba" },
  { id: "milaaha", name: "milaaha", nickname: "milaaha", login: "milaaha" },
]
const STREAMER_OF_THE_YEAR_NOMINEES = [
  { id: "deko6", name: "deko6", nickname: "deko6", login: "deko6" },
  { id: "fl1per4", name: "fl1per4", nickname: "fl1per4", login: "fl1per4" },
  { id: "shizi_kroc", name: "shizi_kroc", nickname: "shizi_kroc", login: "shizi_kroc" },
  { id: "panzavr", name: "panzavr", nickname: "panzavr", login: "panzavr" },
  { id: "morymukh", name: "morymukh", nickname: "morymukh", login: "morymukh" },
  { id: "ev1leye9", name: "ev1leye9", nickname: "ev1leye9", login: "ev1leye9" },
  { id: "malzaharberkut", name: "malzaharberkut", nickname: "malzaharberkut", login: "malzaharberkut" },
  { id: "ptizasinitsa", name: "ptizasinitsa", nickname: "ptizasinitsa", login: "ptizasinitsa" },
  { id: "pyvnyiflex", name: "pyvnyiflex", nickname: "pyvnyiflex", login: "pyvnyiflex" },
  { id: "dannyelgray", name: "dannyelgray", nickname: "dannyelgray", login: "dannyelgray" },
  { id: "deedoseetv", name: "deedoseetv", nickname: "deedoseetv", login: "deedoseetv" },
  { id: "slakesz", name: "slakesz", nickname: "slakesz", login: "slakesz" },
  { id: "harris_0ne", name: "harris_0ne", nickname: "harris_0ne", login: "harris_0ne" },
  { id: "astr0phytum", name: "astr0phytum", nickname: "astr0phytum", login: "astr0phytum" },
  { id: "twaryna", name: "twaryna", nickname: "twaryna", login: "twaryna" },
  { id: "tonymontony", name: "tonymontony", nickname: "tonymontony", login: "tonymontony" },
  { id: "stefrudy", name: "stefrudy", nickname: "stefrudy", login: "stefrudy" },
  { id: "skalii_", name: "skalii_", nickname: "skalii_", login: "skalii_" },
  { id: "atamankit", name: "atamankit", nickname: "atamankit", login: "atamankit" },
  { id: "yourpovilitel", name: "yourpovilitel", nickname: "yourpovilitel", login: "yourpovilitel" },
  { id: "trener", name: "trener", nickname: "trener", login: "trener" },
  { id: "pavloviypp", name: "pavloviypp", nickname: "pavloviypp", login: "pavloviypp" },
  { id: "kostianua", name: "kostianua", nickname: "kostianua", login: "kostianua" },
  { id: "leb1ga", name: "Leb1ga", nickname: "leb1ga", login: "leb1ga" },
  { id: "thetremba", name: "TheTremba", nickname: "thetremba", login: "thetremba" },
  { id: "valentinopradagucci", name: "valentinopradagucci", nickname: "valentinopradagucci", login: "valentinopradagucci" },
  { id: "roolex9", name: "Roolex9", nickname: "roolex9", login: "roolex9" },
  { id: "ivonyak", name: "Ivonyak", nickname: "ivonyak", login: "ivonyak" },
  { id: "lavielay", name: "lavielay", nickname: "lavielay", login: "lavielay" },
  { id: "olsior", name: "Olsior", nickname: "olsior", login: "olsior" },
  { id: "babooreh", name: "babooreh", nickname: "babooreh", login: "babooreh" },
  { id: "tvorchi_varenychky", name: "tvorchi_varenychky", nickname: "tvorchi_varenychky", login: "tvorchi_varenychky" },
  { id: "rat1bor", name: "rat1bor", nickname: "rat1bor", login: "rat1bor" },
  { id: "ukrsoulful", name: "ukrsoulful", nickname: "ukrsoulful", login: "ukrsoulful" },
  { id: "the_rich_texan", name: "the_rich_texan", nickname: "the_rich_texan", login: "the_rich_texan" },
  { id: "max_f1ne", name: "max_f1ne", nickname: "max_f1ne", login: "max_f1ne" },
  { id: "deviantsev", name: "deviantsev", nickname: "deviantsev", login: "deviantsev" },
  { id: "1ankor", name: "1ankor", nickname: "1ankor", login: "1ankor" },
  { id: "hevko0", name: "hevko0", nickname: "hevko0", login: "hevko0" },
  { id: "1nsane_puncher", name: "1nsane_puncher", nickname: "1nsane_puncher", login: "1nsane_puncher" },
  { id: "olejneolej", name: "olejneolej", nickname: "olejneolej", login: "olejneolej" },
  { id: "c1dol3mm", name: "c1dol3mm", nickname: "c1dol3mm", login: "c1dol3mm" },
  { id: "pask3vych", name: "pask3vych", nickname: "pask3vych", login: "pask3vych" },
  { id: "otolich", name: "otolich", nickname: "otolich", login: "otolich" },
  { id: "bar_ozzi", name: "bar_ozzi", nickname: "bar_ozzi", login: "bar_ozzi" },
  { id: "foxenkko", name: "foxenkko", nickname: "foxenkko", login: "foxenkko" },
  { id: "slippeua", name: "slippeua", nickname: "slippeua", login: "slippeua" },
  { id: "airkurgan", name: "airkurgan", nickname: "airkurgan", login: "airkurgan" },
  { id: "zdarovaotec112", name: "zdarovaotec112", nickname: "zdarovaotec112", login: "zdarovaotec112" },
  { id: "quarryck", name: "quarryck", nickname: "quarryck", login: "quarryck" },
  { id: "krapkacoma", name: "krapkacoma", nickname: "krapkacoma", login: "krapkacoma" },
  { id: "smoky", name: "smoky", nickname: "smoky", login: "smoky" },
  { id: "skevich_", name: "skevich_", nickname: "skevich_", login: "skevich_" },
  { id: "aleksov", name: "aleksov", nickname: "aleksov", login: "aleksov" },
  { id: "solid_goodstone", name: "solid_goodstone", nickname: "solid_goodstone", login: "solid_goodstone" },
  { id: "mxtokyo", name: "mxtokyo", nickname: "mxtokyo", login: "mxtokyo" },
  { id: "volynyatko", name: "volynyatko", nickname: "volynyatko", login: "volynyatko" },
  { id: "casuscloud", name: "casuscloud", nickname: "casuscloud", login: "casuscloud" },
  { id: "nazaretto333", name: "nazaretto333", nickname: "nazaretto333", login: "nazaretto333" },
  { id: "rpoxu", name: "rpoxu", nickname: "rpoxu", login: "rpoxu" },
  { id: "icepepepopusk", name: "icepepepopusk", nickname: "icepepepopusk", login: "icepepepopusk" },
  { id: "difu3en", name: "difu3en", nickname: "difu3en", login: "difu3en" },
  { id: "olejandrooo", name: "olejandrooo", nickname: "olejandrooo", login: "olejandrooo" },
  { id: "tse_jenya_i_anya", name: "tse_jenya_i_anya", nickname: "tse_jenya_i_anya", login: "tse_jenya_i_anya" },
  { id: "kuranvlad", name: "kuranvlad", nickname: "kuranvlad", login: "kuranvlad" },
  { id: "ven4oss", name: "ven4oss", nickname: "ven4oss", login: "ven4oss" },
  { id: "allidarsu", name: "allidarsu", nickname: "allidarsu", login: "allidarsu" },
  { id: "link2k", name: "link2k", nickname: "link2k", login: "link2k" },
  { id: "zombakua", name: "zombakua", nickname: "zombakua", login: "zombakua" },
  { id: "yunglenis", name: "yunglenis", nickname: "yunglenis", login: "yunglenis" },
  { id: "taitake", name: "taitake", nickname: "taitake", login: "taitake" },
  { id: "pixelfedya", name: "pixelfedya", nickname: "pixelfedya", login: "pixelfedya" },
  { id: "meditation_ua", name: "meditation_ua", nickname: "meditation_ua", login: "meditation_ua" },
  { id: "cleyrey", name: "cleyrey", nickname: "cleyrey", login: "cleyrey" },
  { id: "connor_qq", name: "connor_qq", nickname: "connor_qq", login: "connor_qq" },
  { id: "doubleespresso", name: "doubleespresso", nickname: "doubleespresso", login: "doubleespresso" },
  { id: "fur0ske", name: "fur0ske", nickname: "fur0ske", login: "fur0ske" },
  { id: "ghostik", name: "ghostik", nickname: "ghostik", login: "ghostik" },
  { id: "juggua", name: "juggua", nickname: "juggua", login: "juggua" },
  { id: "artone619", name: "artone619", nickname: "artone619", login: "artone619" },
  { id: "blockbaby_4eal", name: "blockbaby_4eal", nickname: "blockbaby_4eal", login: "blockbaby_4eal" },
  { id: "did_shinobi", name: "did_shinobi", nickname: "did_shinobi", login: "did_shinobi" },
  { id: "lusty_dog", name: "lusty_dog", nickname: "lusty_dog", login: "lusty_dog" },
  { id: "spacemanlive", name: "spacemanlive", nickname: "spacemanlive", login: "spacemanlive" },
  { id: "usachman", name: "usachman", nickname: "usachman", login: "usachman" },
  { id: "r0r1ch", name: "r0r1ch", nickname: "r0r1ch", login: "r0r1ch" },
  { id: "moreabsurdy", name: "moreabsurdy", nickname: "moreabsurdy", login: "moreabsurdy" },
  { id: "yori1k", name: "yori1k", nickname: "yori1k", login: "yori1k" },
  { id: "pol0nskyi", name: "pol0nskyi", nickname: "pol0nskyi", login: "pol0nskyi" },
  { id: "radioboyo", name: "radioboyo", nickname: "radioboyo", login: "radioboyo" },
  { id: "olehovychtut", name: "olehovychtut", nickname: "olehovychtut", login: "olehovychtut" },
  { id: "v0ltm4n", name: "v0ltm4n", nickname: "v0ltm4n", login: "v0ltm4n" },
  { id: "kavalets", name: "kavalets", nickname: "kavalets", login: "kavalets" },
  { id: "dmytro_tyutyun", name: "dmytro_tyutyun", nickname: "dmytro_tyutyun", login: "dmytro_tyutyun" },
  { id: "kharkivets", name: "kharkivets", nickname: "kharkivets", login: "kharkivets" },
  { id: "itsmoysha", name: "itsmoysha", nickname: "itsmoysha", login: "itsmoysha" },
  { id: "nimbleem", name: "nimbleem", nickname: "nimbleem", login: "nimbleem" },
  { id: "mrsilly_boy", name: "mrsilly_boy", nickname: "mrsilly_boy", login: "mrsilly_boy" },
  { id: "mr__brom", name: "mr__brom", nickname: "mr__brom", login: "mr__brom" },
  { id: "masllory", name: "masllory", nickname: "masllory", login: "masllory" },
  { id: "ringoua", name: "ringoua", nickname: "ringoua", login: "ringoua" },
  { id: "dedofu", name: "dedofu", nickname: "dedofu", login: "dedofu" },
  { id: "didusyk", name: "didusyk", nickname: "didusyk", login: "didusyk" },
  { id: "vtomleni", name: "vtomleni", nickname: "vtomleni", login: "vtomleni" },
  { id: "panmykolai", name: "panmykolai", nickname: "panmykolai", login: "panmykolai" },
  { id: "deneti_mi", name: "deneti_mi", nickname: "deneti_mi", login: "deneti_mi" },
  { id: "sviaks", name: "sviaks", nickname: "sviaks", login: "sviaks" },
  { id: "damnitskyi", name: "damnitskyi", nickname: "damnitskyi", login: "damnitskyi" },
  { id: "villanelle_9", name: "villanelle_9", nickname: "villanelle_9", login: "villanelle_9" },
  { id: "Daelon02", name: "Daelon02", nickname: "Daelon02", login: "Daelon02" },
  { id: "do_minat", name: "do_minat", nickname: "do_minat", login: "do_minat" },
  { id: "leniniw", name: "leniniw", nickname: "leniniw", login: "leniniw" },
  { id: "ceh9", name: "ceh9", nickname: "ceh9", login: "ceh9" },
  { id: "bananium_", name: "bananium_", nickname: "bananium_", login: "bananium_" },
  { id: "rolik33", name: "rolik33", nickname: "rolik33", login: "rolik33" },
  { id: "moon_sanik", name: "moon_sanik", nickname: "moon_sanik", login: "moon_sanik" },
  { id: "archi_bones", name: "archi_bones", nickname: "archi_bones", login: "archi_bones" }
];

const CATEGORIES = [
  {
    id: "streamer_of_the_year",
    title: "Стример року",
    description: "Стример, який зробив цей рік легендарним.",
    type: "streamer",
    nominees: STREAMER_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "streamer_girl_of_the_year",
    title: "Стримеркиня року",
    description: "Стримеркиня, яка зробила цей рік легендарним.",
    type: "streamer",
    nominees: STREAMERKA_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "debut_of_the_year",
    title: "Дебют року",
    description: "Найкращий дебют року серед стримерів, хто почав в 2025 році",
    type: "streamer",
    nominees: DEBUT_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "cringe_of_the_year",
    title: "Крінж року",
    description:
      "Стрімер, який подарував найбільше крінжових, але незабутніх моментів.",
    type: "streamer",
    nominees: ALL_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "irl_streamer_of_the_year",
    title: "IRL-стример року",
    description: "Найцікавіші прогулянки, поїздки та живе спілкування.",
    type: "streamer",
    nominees: IRL_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "vtuber_of_the_year",
    title: "VTuber року",
    description: "Найяскравіший VTuber року",
    type: "streamer",
    nominees: VTUBER_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "community_of_the_year",
    title: "Комʼюніті року",
    description:
      "Стрімер із найтеплішим, найактивнішим і найприємнішим комʼюніті.",
    type: "streamer",
    nominees: ALL_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "cs_of_the_year",
    title: "CS2-стример року",
    description: "Найкращий CS2-стример року.",
    type: "streamer",
    nominees: CS_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "dota_of_the_year",
    title: "Dota 2 стример року",
    description: "Найкращий Dota 2 стример року.",
    type: "streamer",
    nominees: DOTA_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "gamer_of_the_year",
    title: "Ігровий стример року",
    description: "Стример, який цього року найкраще показав себе в іграх: від соло-проходжень до командних матчів.",
    type: "streamer",
    nominees: GAMER_OF_THE_YEAR_NOMINEES,
  }  
];

const avatarClientCache = {};

// рандомайзер
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// правильне слово "стрімер/стрімери/стрімерів"
function getStreamerWord(count) {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;

  if (n > 10 && n < 20) return "стримерів";
  if (n1 === 1) return "стример";
  if (n1 >= 2 && n1 <= 4) return "стримери";
  return "стримерів";
}

function StreamerCard({
  categoryId,
  nominee,
  isSelected,
  onSelect,
  className = "",
}) {
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    if (!nominee.login) return;

    const key = nominee.login.toLowerCase();
    if (avatarClientCache[key]) {
      setAvatarUrl(avatarClientCache[key]);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const r = await fetch(
          `/api/twitch-avatar?login=${encodeURIComponent(key)}`
        );
        if (!r.ok) return;
        const data = await r.json();
        if (!cancelled && data.url) {
          avatarClientCache[key] = data.url;
          setAvatarUrl(data.url);
        }
      } catch (e) {
        console.error("avatar error", key, e);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [nominee.login]);

  const handleSelect = () => onSelect(categoryId, nominee.id);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={`cursor-pointer text-center rounded-2xl border px-5 py-5 text-sm md:text-[15px] transition ${
        isSelected
          ? "border-amber-400 bg-amber-400/10"
          : "border-slate-700 bg-black/30 hover:border-amber-300"
      } ${className}`}
    >
      <div className="mx-auto h-16 w-16 md:h-20 md:w-20 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
        {avatarUrl ? (
          <img
            src={`/api/img?url=${encodeURIComponent(avatarUrl)}`}
            alt={`${nominee.name} avatar`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-base font-semibold text-slate-300">
            {nominee.name?.[0]?.toUpperCase() || "?"}
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="font-semibold leading-tight text-[15px]">
          {nominee.name}
        </div>
        {nominee.nickname && (
          <div className="text-xs text-slate-400">@{nominee.nickname}</div>
        )}
      </div>

      {nominee.login && (
        <a
          href={`https://twitch.tv/${nominee.login}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-4 inline-flex items-center justify-center gap-1 rounded-full border border-slate-600 px-4 py-1.5 text-[11px] text-slate-300 hover:border-amber-400 hover:text-amber-300"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span>Twitch</span>
        </a>
      )}
    </div>
  );
}

function getOrCreateVoterToken() {
  if (typeof window === "undefined") return null;

  let token = window.localStorage.getItem(VOTER_TOKEN_KEY);
  if (!token) {
    if (window.crypto && window.crypto.randomUUID) {
      token = window.crypto.randomUUID();
    } else {
      token = Date.now().toString() + "_" + Math.random().toString(16).slice(2);
    }
    window.localStorage.setItem(VOTER_TOKEN_KEY, token);
  }
  return token;
}

export default function StreamerAwardsPage() {
  const [selectedNominees, setSelectedNominees] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [popup, setPopup] = useState(null);

  const [searchByCategory, setSearchByCategory] = useState({});

  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // таймер
  const [timeLeft, setTimeLeft] = useState(null);

  // рандомний порядок номінантів у всіх категоріях
  const [randomCategories] = useState(() =>
    CATEGORIES.map((cat) => ({
      ...cat,
      nominees: shuffleArray(cat.nominees),
    }))
  );

  useEffect(() => {
    getOrCreateVoterToken();

    async function loadAuth() {
      try {
        const r = await fetch("/api/auth/twitch/me", {
          credentials: "include",
        });
        const data = await r.json();
        if (data.loggedIn) {
          setAuthUser(data.user);
        } else {
          setAuthUser(null);
        }
      } catch (e) {
        console.error("auth/me error", e);
        setAuthUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    loadAuth();
  }, []);

  // оновлення таймера
  useEffect(() => {
    function updateTimer() {
      const deadlineTs = new Date(VOTING_DEADLINE).getTime();
      const now = Date.now();
      const diff = deadlineTs - now;

      if (diff <= 0) {
        setTimeLeft({ ended: true });
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (24 * 3600));
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      setTimeLeft({ ended: false, days, hours, minutes });
    }

    updateTimer();
    const id = setInterval(updateTimer, 60_000); // раз в хвилину
    return () => clearInterval(id);
  }, []);

  const votingClosed = timeLeft?.ended;

  const handleSelect = (categoryId, nomineeId) => {
    setSelectedNominees((prev) => ({
      ...prev,
      [categoryId]: nomineeId,
    }));
  };

  const allSelected = randomCategories.every((cat) => selectedNominees[cat.id]);

  const handleSubmitAll = async () => {
    if (!authUser) {
      const msgText =
        "Щоб проголосувати, спочатку увійди через Twitch (кнопка зверху).";
      setMessage({ type: "error", text: msgText });
      setPopup({
        type: "error",
        title: "Потрібен логін через Twitch",
        text: msgText,
      });
      return;
    }

    if (typeof window !== "undefined") {
      const already = window.localStorage.getItem(HAS_VOTED_KEY) === "1";
      if (already) {
        const msgText =
          "Схоже, ти вже голосував. Голос можна віддати один раз з одного Twitch-акаунту.";
        setMessage({ type: "error", text: msgText });
        setPopup({
          type: "error",
          title: "Голос уже зараховано",
          text: msgText,
        });
        return;
      }
    }

    if (!allSelected) {
      const msgText = "Щоб проголосувати, обери стрімера в КОЖНІЙ категорії.";
      setMessage({
        type: "error",
        text: msgText,
      });
      setPopup({
        type: "error",
        title: "Не всі категорії обрано",
        text: msgText,
      });
      return;
    }

    const voterToken = getOrCreateVoterToken();
    if (!voterToken) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const userAgent =
        typeof navigator !== "undefined" ? navigator.userAgent : "";
      const nickname =
        authUser?.displayName ||
        authUser?.display_name ||
        authUser?.login ||
        "";

      const votes = randomCategories.map((cat) => {
        const nomineeId = selectedNominees[cat.id];
        const nominee = cat.nominees.find((n) => n.id === nomineeId);
        return {
          categoryId: cat.id,
          categoryTitle: cat.title,
          nomineeId,
          nomineeName: nominee ? nominee.name : "",
          voterToken,
          userAgent,
          nickname,
        };
      });

      const responses = await Promise.all(
        votes.map(async (vote) => {
          try {
            const r = await fetch(VOTE_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(vote),
            });
            const data = await r.json().catch(() => ({}));
            console.log("Vote response:", vote.categoryId, data);
            return data;
          } catch (e) {
            console.error("Vote error:", vote.categoryId, e);
            return { status: "error", message: String(e) };
          }
        })
      );

      const statuses = responses.map((r) => r.status);

      if (statuses.every((s) => s === "duplicate")) {
        const msgText =
          "Схоже, ти вже голосував. Голос можна віддати один раз з одного Twitch-акаунту.";
        setMessage({
          type: "error",
          text: msgText,
        });
        setPopup({
          type: "error",
          title: "Ти вже голосував",
          text: msgText,
        });
      } else if (statuses.some((s) => s === "error")) {
        const msgText =
          "Частину голосів не вдалося зберегти. Спробуй пізніше.";
        setMessage({
          type: "error",
          text: msgText,
        });
        setPopup({
          type: "error",
          title: "Помилка відправки голосів",
          text: msgText,
        });
      } else {
        const msgText = "Дякуємо! Твої голоси в усіх категоріях зараховані.";
        setMessage({
          type: "success",
          text: msgText,
        });
        setPopup({
          type: "success",
          title: "Голос зараховано",
          text: msgText,
        });

        if (typeof window !== "undefined") {
          window.localStorage.setItem(HAS_VOTED_KEY, "1");
        }
      }
    } catch (e) {
      console.error(e);
      const msgText =
        "Сталася помилка при відправці голосів. Перевір інтернет або спробуй пізніше.";
      setMessage({
        type: "error",
        text: msgText,
      });
      setPopup({
        type: "error",
        title: "Помилка",
        text: msgText,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050509] text-slate-50">
      {/* HERO */}
      <section className="border-b border-slate-800 mt-20 text-center">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <p className="text-2xl uppercase tracking-[0.25em] text-amber-400 mb-2">
            🏆 Народний
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
            Viewers Choice 2025
          </h1>
          {votingClosed ? (
            <p className="text-slate-300 max-w-2xl text-center mx-auto">
              Голосування завершено! Дякуємо всім, хто взяв участь. Зараз ми підраховуємо результати та готуємо відео з підсумками. Всі результати будуть опубліковані у відкритій таблиці найближчим часом.
            </p>
          ) : (
            <p className="text-slate-300 max-w-2xl text-center mx-auto">
              Вибери свого фаворита в кожній категорії, а потім натисни одну кнопку, щоб віддати голос. Один комплект голосів з одного Twitch-акаунту. Після завершення голосування ми зробимо відео з результатами, а всі підсумки покажемо у відкритій таблиці. Стримери, які переможуть, отримають ще й символічні подарунки — але які саме, хай поки залишиться маленьким секретом.
            </p>
          )}

          {/* таймер */}
          {/* {timeLeft && (
            <div className="mt-4 flex justify-center">
              {timeLeft.ended ? (
                <div className="inline-flex items-center rounded-full border border-red-500/70 bg-red-500/10 px-4 py-2 text-xs md:text-sm text-red-300">
                  Голосування завершено.
                </div>
              ) : (
                <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-amber-400/70 bg-amber-400/10 px-4 py-2 text-xs md:text-sm text-amber-100">
                  <span className="font-semibold tracking-wide uppercase">
                    Голосування триває
                  </span>
                  <span className="h-1 w-1 rounded-full bg-amber-400" />
                  <span>
                    До {VOTING_DEADLINE_DISPLAY} залишилось{" "}
                    <strong>
                      {timeLeft.days}д {timeLeft.hours}год {timeLeft.minutes}хв
                    </strong>
                  </span>
                </div>
              )}
            </div>
          )} */}

          {!votingClosed && (
            <div className="mt-5 flex items-center justify-center gap-3 text-sm">
              {authLoading ? (
                <span className="text-slate-400">Перевіряємо логін...</span>
              ) : authUser ? (
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">
                    Залогінений як{" "}
                    <strong>{authUser.displayName || authUser.login}</strong>
                  </span>
                  <button
                    type="button"
                    className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:border-red-400 hover:text-red-300"
                    onClick={async () => {
                      try {
                        await fetch("/api/auth/twitch/logout", {
                          method: "POST",
                          credentials: "include",
                        });
                        setAuthUser(null);
                      } catch (e) {
                        console.error("logout error", e);
                      }
                    }}
                  >
                    Вийти
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-slate-400">
                    Щоб проголосувати, увійди через Twitch.
                  </span>
                  <a
                    href="/api/auth/twitch/login?next=/viewers-choice"
                    className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-black"
                  >
                    Увійти через Twitch
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {!votingClosed && (
        <>
          {/* HOW IT WORKS */}
          <section className="border-b border-slate-800 bg-[#070712]">
            <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
              <h2 className="text-lg font-semibold mb-4">Як це працює?</h2>
              <div className="grid gap-4 md:grid-cols-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
                  <div className="mb-2 text-amber-400 font-semibold">1. Обираєш</div>
                  <p>
                    У кожній категорії натискаєш на стрімера, за якого голосуєш.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
                  <div className="mb-2 text-amber-400 font-semibold">
                    2. Підтверджуєш
                  </div>
                  <p>Коли всі категорії заповнені — тиснеш "Проголосувати".</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
                  <div className="mb-2 text-amber-400 font-semibold">
                    3. Чекаєш результати
                  </div>
                  <p>
                    Усі голоси потрапляють у таблицю, а потім ми публікуємо
                    підсумки.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {message && (
            <div
              className={`mx-auto mt-6 max-w-6xl px-4 text-sm ${
                message.type === "success" ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}
          <section className="border-t border-slate-800 bg-[#050509]">
            <div className="mx-auto max-w-6xl px-4 py-8 md:py-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="text-center lg:text-left max-w-xl text-sm text-slate-300">
                <h2 className="text-base  font-semibold mb-2">
                  Підтримати нас
                </h2>
                <p className="mb-2">
                  Ми не маємо спонсора і робимо все на ентузіазмі. Але всеодно хочемо допомогти якось зсу, тому все що надійде на цю банку, то відправимо на якийсь збір стрімерів і гроші підуть в добру справу.
                </p>
              </div>
              <div className="mx-auto lg:mx-0 w-40 h-40 md:w-48 md:h-48 rounded-2xl border bg-black/60 flex items-center justify-center overflow-hidden">
                {/* Замінити на реальний QR-код Монобанки */}
                <img
                  src={code}
                  alt="QR-код Монобанки для підтримки каналу"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </section>
          {/* CATEGORIES */}
          <section className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        {randomCategories.map((cat) => {
          const SEARCHABLE_CATEGORY_IDS = [
            "streamer_of_the_year",
            "streamer_girl_of_the_year",
            "cringe_of_the_year",
            "community_of_the_year",
            "gamer_of_the_year",
          ];
          
          const isSearchableCategory = SEARCHABLE_CATEGORY_IDS.includes(cat.id);

          const searchQuery = (
            searchByCategory[cat.id] || ""
          ).trim().toLowerCase();

          let nomineesToShow = cat.nominees;

          if (isSearchableCategory && searchQuery) {
            nomineesToShow = cat.nominees.filter((n) => {
              const name = (n.name || "").toLowerCase();
              const nick = (n.nickname || "").toLowerCase();
              const login = (n.login || "").toLowerCase();
              return (
                name.includes(searchQuery) ||
                nick.includes(searchQuery) ||
                login.includes(searchQuery)
              );
            });
          }

          return (
            <article
              key={cat.id}
              id={cat.id}
              className="rounded-3xl border border-slate-800 bg-black/40 p-6 md:p-8"
            >
              <header className="mb-4 md:mb-5">
                <p className="text-xs uppercase tracking-[0.25em] text-amber-400 mb-1">
                  Категорія
                </p>
                <h3 className="text-xl md:text-2xl font-bold mb-1">
                  {cat.title}
                </h3>
                <p className="text-sm text-slate-300 max-w-2xl">
                  {cat.description}
                </p>
              </header>

              {/* Пошук для Стрімер року + Стримерка року */}
              {isSearchableCategory ? (
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <input
                    type="text"
                    placeholder="Пошук стрімера за ніком..."
                    value={searchByCategory[cat.id] || ""}
                    onChange={(e) =>
                      setSearchByCategory((prev) => ({
                        ...prev,
                        [cat.id]: e.target.value,
                      }))
                    }
                    className="w-full md:w-96 rounded-full border border-slate-700 bg-black/50 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                  <span className="text-sm text-slate-200">
                    У списку {cat.nominees.length}{" "}
                    {getStreamerWord(cat.nominees.length)}
                  </span>
                </div>
              ) : (
                <div className="text-right mb-4 text-sm text-slate-200">
                  У списку {cat.nominees.length}{" "}
                  {getStreamerWord(cat.nominees.length)}
                </div>
              )}

              {/* Сітка 3 рядки для всіх категорій */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[680px] overflow-y-auto pr-2">
                {nomineesToShow.map((nominee) => {
                  const isSelected = selectedNominees[cat.id] === nominee.id;
                  return (
                    <StreamerCard
                      key={nominee.id}
                      categoryId={cat.id}
                      nominee={nominee}
                      isSelected={isSelected}
                      onSelect={handleSelect}
                      className=""
                    />
                  );
                })}

                {nomineesToShow.length === 0 && (
                  <div className="col-span-full text-sm text-slate-400">
                    Нічого не знайдено за цим запитом.
                  </div>
                )}
              </div>
            </article>
          );
        })}

            {/* кнопка під формою */}
            <div className="mt-8 flex flex-col gap-2 border-t border-slate-800 pt-6">
              <button
                type="button"
                className="self-start rounded-full bg-amber-400 px-7 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
                disabled={!allSelected || submitting || votingClosed}
                onClick={handleSubmitAll}
              >
                {votingClosed
                  ? "Голосування завершено"
                  : submitting
                  ? "Відправляємо голоси..."
                  : "Проголосувати за всі категорії"}
              </button>
              <span className="text-xs text-slate-400">
                Щоб кнопка стала активною, потрібно обрати стрімера в кожній
                категорії.
              </span>
            </div>
          </section>
        </>
      )}

      {/* Секція про закінчення голосування */}
      {votingClosed && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="rounded-3xl border border-amber-400/30 bg-amber-400/5 p-8 md:p-12 text-center">
            <div className="text-6xl md:text-7xl mb-6">🎉</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-amber-400">
              Голосування завершено!
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-6">
              Дякуємо всім, хто взяв участь у Viewers Choice 2025! Ваші голоси зібрані та ми вже підраховуємо результати.
            </p>
            <div className="rounded-2xl border border-slate-800 bg-black/40 p-6 max-w-xl mx-auto text-left">
              <h3 className="font-semibold mb-3 text-slate-100">Що далі?</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Ми вже підраховуємо всі голоси з усіх категорій</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 ">•</span>
                  <span>Відео з результатами та переможцями вийде <strong className="text-amber-400">11.01.2026</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 ">•</span>
                  <span>Опублікуємо всі підсумки у відкритій таблиці</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Переможці отримають символічні подарунки</span>
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <p className="text-sm text-slate-400 mb-4">
                Слідкуйте за більшими новинами в наших каналах!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://www.youtube.com/@vamoosnarizky"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 md:text-lg rounded-2xl text-base text-white font-bold bg-gradient-to-br from-red-500 to-fuchsia-500 hover:from-red-400 hover:to-fuchsia-400 border border-white/10 shadow-[0_4px_20px_rgba(139,92,246,.25)] transition-all duration-200 hover:shadow-[0_6px_26px_rgba(139,92,246,.35)] hover:translate-y-[-1px]"
                >
                  Перейти на YouTube 🚀
                </a>
                <a
                  href="https://t.me/vamooschannel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 md:text-lg rounded-2xl text-base text-white font-bold bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 border border-white/10 shadow-[0_4px_20px_rgba(59,130,246,.25)] transition-all duration-200 hover:shadow-[0_6px_26px_rgba(59,130,246,.35)] hover:translate-y-[-1px]"
                >
                  Перейти в Telegram 📱
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ///* FAQ під формою
      <section className="border-t border-slate-800 bg-[#050509]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
          <h2 className="text-lg font-semibold mb-4">FAQ — часті питання</h2>
          <div className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
              <h3 className="font-semibold mb-1 text-slate-100">
                Хто може голосувати?
              </h3>
              <p>
                Голосувати може будь-хто, хто має Twitch-акаунт. Ми отримуємо ваш айді твіча і нік, щоб уникнути мультиголосування.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
              <h3 className="font-semibold mb-1 text-slate-100">
                Чому можна голосувати лише один раз?
              </h3>
              <p>
                Ми поєднуємо анонімний ID пристрою та Twitch-логін, щоб уникнути
                накруток і зробити результат максимально чесним.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
              <h3 className="font-semibold mb-1 text-slate-100">
                Коли будуть результати?
              </h3>
              <p>
                Після дедлайну голосування ({VOTING_DEADLINE_DISPLAY}) ми
                зіб’ємо результати та опублікуємо їх у відкритому доступі.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
              <h3 className="font-semibold mb-1 text-slate-100">
                Кому можу написати і задати питання? 
              </h3>
              <p>
                У нас є прекрасний хлопчик, який може відповісти на всі ваші питання.
                (Додавати нових людей вже не можна)
                <a href="https://t.me/NosochokShkarpetkovych" className="text-amber-400 hover:text-amber-300">
                   <br />
                   тг: @NosochokShkarpetkovych
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>   */} 

      {/* {popup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl bg-[#050509] border border-slate-700 p-5 shadow-xl">
            <h2 className="text-lg font-semibold mb-2">{popup.title}</h2>
            <p className="text-sm text-slate-300 mb-4">{popup.text}</p>
            <button
              type="button"
              className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black"
              onClick={() => setPopup(null)}
            >
              Окей
            </button>
          </div>
        </div>
      )} */}
        {/* YouTube секція */}
        {/* <YouTubeSection /> */}
        <Footer />
    </main>
  );
  
}