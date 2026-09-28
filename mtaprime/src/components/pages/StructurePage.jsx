"use client";

import { useTranslations } from "next-intl";
import React from "react";

// სტრუქტურის მონაცემები ფოტოს მიხედვით

export default function Structure() {
  const t = useTranslations("StructurePage");
  const { structureData } = getLocalizedContent(t);
  return (
    <main className="w-full overflow-x-auto bg-surface px-6 pb-16 pt-36">
      <div className="min-w-[1200px]">
        <div className="max-w-[1600px] mx-auto flex flex-col items-center">
          {/* top level: director */}
          <div className="flex flex-col items-center mb-8 relative">
            {/* staff boxes left */}
            <div className="flex gap-3 mb-6">
              {structureData.director.staff.map((s, idx) => (
                <div
                  key={idx}
                  className="border-2 border-dashed border-muted bg-canvas px-3 py-2 text-xs font-semibold text-center text-ink rounded w-36 flex items-center justify-center min-h-[48px]"
                >
                  {s.name}
                </div>
              ))}
            </div>

            {/* main director box */}
            <div className="bg-ink text-canvas font-bold text-lg px-12 py-3 rounded shadow-md z-10 min-w-[240px] text-center">
              {structureData.director.title}
            </div>

            {/* top direct departments */}
            <div className="grid grid-cols-4 gap-4 mt-8 w-full max-w-5xl">
              {structureData.director.topDepartments.map((dept, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="border border-border bg-canvas p-2 text-xs font-bold text-center text-ink rounded w-full min-h-[52px] flex items-center justify-center shadow-sm">
                    {dept.title}
                  </div>
                  {dept.sub.length > 0 && (
                    <div className="flex flex-col gap-2 mt-3 w-full">
                      {dept.sub.map((sub, sIdx) => (
                        <div
                          key={sIdx}
                          className="border-2 border-dashed border-muted bg-canvas p-2 text-[11px] text-center text-muted rounded"
                        >
                          {sub}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* separator line */}
          <div className="w-full h-1 bg-brand-yellow my-6"></div>

          {/* 4 director columns */}
          <div className="grid grid-cols-4 gap-6 w-full">
            {structureData.directors.map((dir, idx) => (
              <div key={idx} className="flex flex-col items-center">
                {/* director header */}
                <div className="bg-ink text-canvas font-bold text-sm px-4 py-3 rounded text-center w-full min-h-[56px] flex items-center justify-center shadow">
                  {dir.title}
                </div>

                {/* departments underneath */}
                <div className="flex flex-col gap-4 mt-4 w-full">
                  {dir.departments.map((dept, dIdx) => (
                    <div
                      key={dIdx}
                      className="flex flex-col items-center w-full"
                    >
                      <div
                        className={`p-2 text-xs text-center font-semibold rounded w-full min-h-[48px] flex items-center justify-center ${dept.type === "dotted" ? "border-2 border-dashed border-muted bg-canvas text-ink" : "border border-border bg-canvas text-ink shadow-sm"}`}
                      >
                        {dept.title}
                      </div>

                      {/* services list */}
                      {dept.services.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2 w-[90%]">
                          {dept.services.map((srv, sIdx) => (
                            <div
                              key={sIdx}
                              className="border-2 border-dashed border-muted bg-canvas p-2 text-[10px] text-center text-muted rounded"
                            >
                              {srv}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
function getLocalizedContent(t) {
  const structureData = {
    director: {
      title: t("text_54317c"),
      staff: [
        {
          name: t("text_9706de"),
          type: "dotted",
        },
        {
          name: t("text_56c49e"),
          type: "dotted",
        },
        {
          name: t("text_4e789f"),
          type: "dotted",
        },
      ],
      topDepartments: [
        {
          title: t("text_3fc582"),
          sub: [t("text_63172e"), t("text_ba5a30")],
        },
        {
          title: t("text_008dea"),
          sub: [],
        },
        {
          title: t("text_93f62a"),
          sub: [],
        },
        {
          title: t("text_7b1948"),
          sub: [t("text_8814c6"), t("text_533b7a")],
        },
      ],
    },
    directors: [
      {
        title: t("text_38db77"),
        departments: [
          {
            title: t("text_d9868b"),
            type: "solid",
            services: [t("text_a30044"), t("text_14e5f9"), t("text_d051fc")],
          },
          {
            title: t("text_63f69e"),
            type: "solid_box",
            services: [],
          },
        ],
      },
      {
        title: t("text_07ae4e"),
        departments: [
          {
            title: t("text_28dba1"),
            type: "solid",
            services: [
              t("text_524ce6"),
              t("text_f52c46"),
              t("text_8f7ea1"),
              t("text_90e9dc"),
            ],
          },
          {
            title: t("text_213f07"),
            type: "solid",
            services: [
              t("text_524ce6"),
              t("text_f52c46"),
              t("text_8f7ea1"),
              t("text_90e9dc"),
            ],
          },
          {
            title: t("text_b3f4fb"),
            type: "solid",
            services: [t("text_524ce6"), t("text_f52c46"), t("text_8f7ea1")],
          },
          {
            title: t("text_096d44"),
            type: "solid",
            services: [t("text_524ce6"), t("text_f52c46"), t("text_8f7ea1")],
          },
          {
            title: t("text_6db06a"),
            type: "solid",
            services: [t("text_763b00"), t("text_320bc4")],
          },
        ],
      },
      {
        title: t("text_8707b2"),
        departments: [
          {
            title: t("text_322643"),
            type: "solid",
            services: [],
          },
          {
            title: t("text_5ca2de"),
            type: "solid",
            services: [],
          },
          {
            title: t("text_24bbe2"),
            type: "solid",
            services: [],
          },
          {
            title: t("text_fd87a1"),
            type: "dotted",
            services: [],
          },
        ],
      },
      {
        title: t("text_3754d5"),
        departments: [
          {
            title: t("text_574b1d"),
            type: "solid",
            services: [],
          },
          {
            title: t("text_fac26a"),
            type: "solid",
            services: [],
          },
          {
            title: t("text_6b718e"),
            type: "dotted",
            services: [],
          },
          {
            title: t("text_71f3cc"),
            type: "dotted",
            services: [],
          },
          {
            title: t("text_f80fa0"),
            type: "solid",
            services: [],
          },
          {
            title: t("text_8911f3"),
            type: "dotted",
            services: [],
          },
          {
            title: t("text_90e9dc"),
            type: "dotted",
            services: [],
          },
        ],
      },
    ],
  };
  return {
    structureData,
  };
}
