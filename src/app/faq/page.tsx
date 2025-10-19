'use client';

import React, { useState } from 'react';
import faqData from '@/data/jsons/__faq.json';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQCategory {
  category: string;
  questions: FAQItem[];
}

const FAQPage = () => {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const toggleQuestion = (id: string) => {
    setOpenQuestion(openQuestion === id ? null : id);
  };

  return (
    <div className="container py-10 lg:py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-8 lg:mb-12 text-center">
        Foire Aux Questions (FAQ)
      </h1>

      <div className="max-w-3xl mx-auto space-y-8">
        {faqData.map((cat: FAQCategory, catIndex: number) => (
          <div key={catIndex} className="bg-white dark:bg-neutral-800 shadow-lg rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6 border-b border-neutral-200 dark:border-neutral-700 pb-4">
              {cat.category}
            </h2>
            <div className="space-y-4">
              {cat.questions.map((item: FAQItem) => (
                <div key={item.id} className="border-b border-neutral-100 dark:border-neutral-700 last:border-b-0 pb-4 last:pb-0">
                  <button
                    className="flex justify-between items-center w-full text-left font-medium text-lg text-neutral-800 dark:text-neutral-200 py-2"
                    onClick={() => toggleQuestion(item.id)}
                  >
                    <span>{item.question}</span>
                    <ChevronDownIcon
                      className={`w-5 h-5 transform ${openQuestion === item.id ? 'rotate-180' : 'rotate-0'} transition-transform duration-200`}
                    />
                  </button>
                  {openQuestion === item.id && (
                    <div className="mt-2 text-neutral-600 dark:text-neutral-300 pr-4 pb-2">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQPage;