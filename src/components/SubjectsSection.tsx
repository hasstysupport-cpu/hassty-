import React from 'react';
import {
  Calculator,
  Languages,
  BookOpen,
  Atom,
  FlaskConical,
  Microscope,
  Dna,
  Globe,
  ArrowLeft,
  Users
} from 'lucide-react';
import { SUBJECTS_DATA } from '../data/mockData';

interface SubjectsSectionProps {
  onSelectSubject: (subjectName: string) => void;
}

export const SubjectsSection: React.FC<SubjectsSectionProps> = ({ onSelectSubject }) => {
  const getSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calculator':
        return <Calculator className="w-6 h-6 stroke-[2]" />;
      case 'Languages':
        return <Languages className="w-6 h-6 stroke-[2]" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 stroke-[2]" />;
      case 'Atom':
        return <Atom className="w-5 h-5 stroke-[2]" />;
      case 'FlaskConical':
        return <FlaskConical className="w-5 h-5 stroke-[2]" />;
      case 'Microscope':
        return <Microscope className="w-5 h-5 stroke-[2]" />;
      case 'Dna':
        return <Dna className="w-5 h-5 stroke-[2]" />;
      case 'Globe':
        return <Globe className="w-5 h-5 stroke-[2]" />;
      default:
        return <BookOpen className="w-5 h-5 stroke-[2]" />;
    }
  };

  return (
    <section id="subjects" className="py-16 lg:py-24 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 text-right gap-4">
          <div>
            <div className="inline-block px-3 py-1 bg-[#EFF6FF] text-[#2563EB] text-xs font-bold rounded-full mb-2">
              تغطية تعليمية شاملة
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F2937] tracking-tight">
              تصفح حسب <span className="text-[#2563EB]">المادة</span>
            </h2>
            <p className="text-sm sm:text-base text-[#6B7280] mt-2">
              اختر المادة واستكشف نخبة من المعلمين المعتمدين لمختلف المراحل الدراسية في مصر
            </p>
          </div>

          <button
            onClick={() => onSelectSubject('')}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] transition-colors self-start sm:self-auto cursor-pointer"
            id="subjects-view-all-btn"
          >
            <span>عرض كل المدرسين المتاحين</span>
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* Subjects Grid with Intentional Asymmetry / Featured sizing for Math & English */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {SUBJECTS_DATA.map((subject) => {
            const isFeatured = subject.isFeatured;

            return (
              <div
                key={subject.id}
                onClick={() => onSelectSubject(subject.name)}
                className={`group rounded-2xl border transition-all cursor-pointer text-right flex flex-col justify-between ${
                  isFeatured
                    ? 'sm:col-span-2 bg-[#F8FAFF] border-blue-200 p-6 sm:p-7 hover:border-blue-400 hover:bg-white'
                    : 'bg-white border-gray-200 p-5 sm:p-6 hover:border-blue-300 hover:bg-[#F8FAFF]'
                }`}
                id={`subject-card-${subject.id}`}
              >
                <div>
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`rounded-xl flex items-center justify-center transition-colors ${
                        isFeatured
                          ? 'w-13 h-13 bg-[#EFF6FF] text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white'
                          : 'w-11 h-11 bg-gray-50 text-[#2563EB] border border-gray-100 group-hover:bg-[#EFF6FF]'
                      }`}
                    >
                      {getSubjectIcon(subject.iconName)}
                    </div>

                    {subject.tag && (
                      <span className="px-2.5 py-1 text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-blue-200 rounded-full">
                        {subject.tag}
                      </span>
                    )}
                  </div>

                  {/* Subject Name */}
                  <h3
                    className={`font-bold text-[#1F2937] group-hover:text-[#2563EB] transition-colors mb-1 ${
                      isFeatured ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                    }`}
                  >
                    {subject.name}
                  </h3>

                  {/* Subject Short Description */}
                  <p className="text-xs text-[#6B7280] leading-relaxed mb-4">
                    {subject.description}
                  </p>
                </div>

                {/* Bottom Bar: Teacher Count & Call to Action */}
                <div className="pt-3 border-t border-gray-200/70 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 font-bold text-[#1E3A8A]">
                    <Users className="w-3.5 h-3.5 text-[#2563EB]" />
                    +{subject.tutorCount} مدرس
                  </span>

                  <span className="font-semibold text-[#2563EB] flex items-center gap-1 group-hover:translate-x-[-3px] transition-transform">
                    <span>تصفح</span>
                    <ArrowLeft className="w-3.5 h-3.5 stroke-[2]" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
