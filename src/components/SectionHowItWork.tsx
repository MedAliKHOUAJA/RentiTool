import React, { FC } from "react";
import Heading from "@/shared/Heading";
import Image from "next/image";
import HIW1 from "@/images/tools/trouvez-outil-parfait.png";
import HIW2 from "@/images/tools/reservez-payez-securite.png";
import HIW3 from "@/images/tools/realisez-vous-projets.png";


export interface SectionHowItWorkProps {
  className?: string;
  data?: { id: number; title: string; desc: string; img: string }[];
}

const DATA = [
  {
    id: 1,
    title: "Trouvez l'outil parfait",
    desc: "Parcourez notre large sélection d'outils par catégorie, localisation ou prix.",
    img: HIW1,
  },
  {
    id: 2,
    title: "Réservez et payez en toute sécurité",
    desc: "Contactez le propriétaire, réservez l'outil et payez via notre plateforme sécurisée.",
    img: HIW2,
  },
  {
    id: 3,
    title: "Réalisez vos projets",
    desc: "Récupérez l'outil, utilisez-le pour vos projets et retournez-le facilement.",
    img: HIW3,
  },
];

const SectionHowItWork: FC<SectionHowItWorkProps> = ({ className = "" }) => {
  return (
    <div className={`nc-SectionHowItWork relative ${className}`}>
      <Heading
        isCenter
        desc="Un processus simple et rapide pour louer ou proposer vos outils."
      >
        Comment ça marche ?
      </Heading>
      <div className="mt-20 relative grid md:grid-cols-3 gap-20">
        {DATA.map((item) => (
          <div
            key={item.id}
            className="relative flex flex-col items-center max-w-xs mx-auto"
          >
            <Image
              alt=""
              className="mb-8 max-w-[180px] mx-auto"
              src={item.img}
            />
            <div className="text-center mt-auto">
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <span className="block mt-5 text-neutral-500 dark:text-neutral-400">
                {item.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionHowItWork;
