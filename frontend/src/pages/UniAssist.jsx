import React from "react";
import PageHeader from "../components/PageHeader";
import ChatBox from "../components/ChatBox";

export default function UniAssist() {
  return (
    <div>
      <PageHeader
        eyebrow="Assistant"
        title="AIUB UniAssist AI"
        description="A hybrid RAG assistant that answers questions from the university's official knowledge base - admissions, fees, policies, courses, faculty, and more."
      />
      <ChatBox />
    </div>
  );
}
