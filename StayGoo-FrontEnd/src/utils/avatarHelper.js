export const getGenderedAvatar = (fullName) => {
  if (!fullName) return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80";
  const name = fullName.toLowerCase().trim();
  const firstName = name.split(/\s+/)[0];

  const maleNames = ["camilo", "eduardo", "rafael", "andres", "juan", "carlos", "santiago", "alejandro", "mateo", "luis", "daniel", "felipe", "jose", "david", "diego", "javier", "nicolas", "miguel", "jorge", "pedro", "manuel", "ricardo", "gabriel", "esteban", "pablo", "fernando", "julian", "rodrigo", "oscar", "sergio", "sebastian", "cristian", "lucas", "victor", "angel", "ramon", "francisco", "hugo", "ivan", "kevin", "ruben", "hector", "arturo", "enrique", "jaime", "mauricio", "roberto", "mario", "alberto", "brayan"];
  const femaleNames = ["maria", "mariana", "sofia", "valentina", "isabella", "camila", "valeria", "gabriela", "lucia", "daniela", "manuela", "carolina", "elizabeth", "catalina", "paola", "natalia", "diana", "laura", "andrea", "sara", "ana", "luisa", "claudia", "marta", "elena", "patricia", "carmen", "gloria", "teresa", "rosa", "luciana", "mariela", "isabel", "beatriz", "adriana", "sandra", "monica", "veronica", "clara", "silvia", "alicia", "julia", "cecilia", "lorena", "amalia"];

  let isFemale = false;
  if (femaleNames.includes(firstName)) {
    isFemale = true;
  } else if (maleNames.includes(firstName)) {
    isFemale = false;
  } else {
    // Fallback heurístico: nombres que terminan en "a"
    isFemale = firstName.endsWith("a");
  }

  const maleAvatars = [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80"
  ];

  const femaleAvatars = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 5;

  return isFemale ? femaleAvatars[index] : maleAvatars[index];
};
