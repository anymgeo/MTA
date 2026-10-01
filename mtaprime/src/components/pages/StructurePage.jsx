"use client";

import React from "react";

// სტრუქტურის მონაცემები ფოტოს მიხედვით

export default function Structure({ structureData }) {
  if (!structureData) return null;
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
