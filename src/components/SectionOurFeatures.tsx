import React, { FC } from "react";
import rightImgDemo from "@/images/tools/pourquoi-choisir-rentitool.png";
import Image, { StaticImageData } from "next/image";
import Badge from "@/shared/Badge";

export interface SectionOurFeaturesProps {
  className?: string;
  rightImg?: StaticImageData;
  type?: "type1" | "type2";
}

const SectionOurFeatures: FC<SectionOurFeaturesProps> = ({
  className = "lg:py-14",
  rightImg = rightImgDemo,
  type = "type1",
}) => {
  return (
    <div
      className={`nc-SectionOurFeatures relative flex flex-col items-center ${
        type === "type1" ? "lg:flex-row" : "lg:flex-row-reverse"
      } ${className}`}
      data-nc-id="SectionOurFeatures"
    >
      <div className="flex-grow">
        <Image src={rightImg} alt="" />
      </div>
      <div
        className={`max-w-2xl flex-shrink-0 mt-10 lg:mt-0 lg:w-2/5 ${
          type === "type1" ? "lg:pl-16" : "lg:pr-16"
        }`}
      >
        <span className="uppercase text-sm text-gray-400 tracking-widest">
          AVANTAGES
        </span>
        <h2 className="font-semibold text-4xl mt-5">Pourquoi choisir RentiTool ?</h2>

        <ul className="space-y-10 mt-16">
          <li className="space-y-4">
            <Badge name="Variété" />
            <span className="block text-xl font-semibold">
              Large choix d'outils
            </span>
            <span className="block mt-5 text-neutral-500 dark:text-neutral-400">
              Accédez à une vaste gamme d'outils de bricolage, jardinage et construction, disponibles près de chez vous.
            </span>
          </li>
          <li className="space-y-4">
            <Badge color="green" name="Sécurité" />
            <span className="block text-xl font-semibold">
              Paiements sécurisés
            </span>
            <span className="block mt-5 text-neutral-500 dark:text-neutral-400">
              Toutes les transactions sont protégées par notre plateforme, pour une tranquillité d'esprit totale.
            </span>
          </li>
          <li className="space-y-4">
            <Badge color="red" name="Flexibilité" />
            <span className="block text-xl font-semibold">
              Location locale et flexible
            </span>
            <span className="block mt-5 text-neutral-500 dark:text-neutral-400">
              Louez des outils pour la durée dont vous avez besoin, auprès de particuliers de votre quartier.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SectionOurFeatures;
