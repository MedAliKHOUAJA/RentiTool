"use client";

import { Tab } from "@headlessui/react";
import ToolCard from "@/components/Cards/ToolCard";
import CommentListing from "@/components/CommentListing";
import StartRating from "@/components/StartRating";
import React, { FC, useState, useEffect } from "react";
import Avatar from "@/shared/Avatar";
import ButtonSecondary from "@/shared/ButtonSecondary";
import SocialsList from "@/shared/SocialsList";
import { Tool } from "@/features/tools/domain/tool";
import { User } from "@/features/users/domain/user";

export interface AuthorPageProps {
  params: {
    id: string;
  };
}

const AuthorPage: FC<AuthorPageProps> = ({ params }) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [author, setAuthor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleTools, setVisibleTools] = useState(6);

  // Récupérer les outils de l'auteur
  useEffect(() => {
    const fetchAuthorTools = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tools?ownerId=${params.id}&isActive=true`);
        const data = await response.json();

        if (data.success) {
          setTools(data.tools || []);
          // L'auteur est dans le premier outil
          if (data.tools.length > 0) {
            setAuthor(data.tools[0].owner);
          }
        } else {
          setError(data.error || 'Failed to fetch tools');
        }
      } catch (err) {
        console.error('Error fetching author tools:', err);
        setError('An error occurred while fetching tools');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAuthorTools();
    }
  }, [params.id]);

  const handleLoadMore = () => {
    setVisibleTools(prev => prev + 6);
  };

  const renderSidebar = () => {
    return (
      <div className="w-full flex flex-col items-center text-center sm:rounded-2xl sm:border border-neutral-200 dark:border-neutral-700 space-y-6 sm:space-y-7 px-0 sm:p-6 xl:p-8">
        <Avatar
          hasChecked
          hasCheckedClass="w-6 h-6 -top-0.5 right-2"
          sizeClass="w-28 h-28"
          imgUrl={author ? `/api/users/${author.userId}/avatar` : undefined}
        />

        {/* ---- */}
        <div className="space-y-3 text-center flex flex-col items-center">
          <h2 className="text-3xl font-semibold">
            {author 
              ? `${author.firstName} ${author.lastName}` 
              : loading 
              ? 'Chargement...' 
              : 'Utilisateur inconnu'
            }
          </h2>
          <StartRating className="!text-base" reviewCount={author?.starRating} />
        </div>

        {/* ---- */}
        <p className="text-neutral-500 dark:text-neutral-400">
          Découvrez les outils proposés par cet utilisateur.
        </p>

        {/* ---- */}
        {author?.locationName && (
          <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{author.locationName}</span>
          </div>
        )}

        {/* ---- */}
        <SocialsList
          className="!space-x-3"
          itemClass="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xl"
        />

        {/* ---- */}
        <div className="border-b border-neutral-200 dark:border-neutral-700 w-14"></div>

        {/* ---- */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-neutral-6000 dark:text-neutral-300">
              {tools.length} {tools.length === 1 ? 'outil' : 'outils'}
            </span>
          </div>

          {author?.phone && (
            <div className="flex items-center space-x-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span className="text-neutral-6000 dark:text-neutral-300">
                {author.phone}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSection1 = () => {
    if (loading) {
      return (
        <div className="listingSection__wrap">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="listingSection__wrap">
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      );
    }

    if (tools.length === 0) {
      return (
        <div className="listingSection__wrap">
          <div className="text-center py-20">
            <p className="text-neutral-500 dark:text-neutral-400">
              Cet utilisateur n'a pas encore d'outils disponibles.
            </p>
          </div>
        </div>
      );
    }

    const displayedTools = tools.slice(0, visibleTools);
    const hasMore = visibleTools < tools.length;

    return (
      <div className="listingSection__wrap">
        <div>
          <h2 className="text-2xl font-semibold">
            {author 
              ? `Outils de ${author.firstName} ${author.lastName}` 
              : 'Outils disponibles'
            }
          </h2>
          <span className="block mt-2 text-neutral-500 dark:text-neutral-400">
            {tools.length} {tools.length === 1 ? 'outil disponible' : 'outils disponibles'}
          </span>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>

        <div>
          <div className="mt-8 grid grid-cols-1 gap-6 md:gap-7 sm:grid-cols-2">
            {displayedTools.map((tool) => (
              <ToolCard key={tool.toolId} data={tool} />
            ))}
          </div>
          {hasMore && (
            <div className="flex mt-11 justify-center items-center">
              <ButtonSecondary onClick={handleLoadMore}>
                Voir plus d'outils
              </ButtonSecondary>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSection2 = () => {
    return (
      <div className="listingSection__wrap">
        {/* HEADING */}
        <h2 className="text-2xl font-semibold">Avis des utilisateurs</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>

        {/* comment */}
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          <CommentListing hasListingTitle className="pb-8" />
          <CommentListing hasListingTitle className="py-8" />
          <CommentListing hasListingTitle className="py-8" />
          <CommentListing hasListingTitle className="py-8" />
          <div className="pt-8">
            <ButtonSecondary>Voir plus d'avis</ButtonSecondary>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`nc-AuthorPage`}>
      <main className="container mt-12 mb-24 lg:mb-32 flex flex-col lg:flex-row">
        <div className="block flex-grow mb-24 lg:mb-0">
          <div className="lg:sticky lg:top-24">{renderSidebar()}</div>
        </div>
        <div className="w-full lg:w-3/5 xl:w-2/3 space-y-8 lg:space-y-10 lg:pl-10 flex-shrink-0">
          {renderSection1()}
          {renderSection2()}
        </div>
      </main>
    </div>
  );
};

export default AuthorPage;