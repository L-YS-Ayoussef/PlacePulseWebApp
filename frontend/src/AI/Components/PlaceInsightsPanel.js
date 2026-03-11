import React, { useMemo, useState } from "react";

import Card from "../../Shared/Components/UIElement/Card";
import Button from "../../Shared/Components/FormElements/Button";
import LoadingSpinner from "../../Shared/Components/UIElement/LoadingSpinner";
import "./PlaceInsightsPanel.css";

const PRESET_QUESTIONS = [
  { label: "What do people usually like?", key: "likes" },
  { label: "What do people usually complain about?", key: "complaints" },
  { label: "Best for couples?", key: "bestFor.couples" },
  { label: "Best for families?", key: "bestFor.families" },
  { label: "Best for work?", key: "bestFor.work" },
  { label: "Best for students?", key: "bestFor.students" },
  { label: "Is it expensive?", key: "expensive" },
  { label: "What is the vibe?", key: "vibe" },
];

const getValueByPath = (object, path) =>
  path.split(".").reduce((value, key) => value?.[key], object);

const renderList = (items, emptyText) => {
  if (!items || items.length === 0) {
    return <p className="place-insights__empty">{emptyText}</p>;
  }

  return (
    <ul className="place-insights__list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};

const PlaceInsightsPanel = ({ insight, isLoading, onAskQuestion, asking }) => {
  const [customQuestion, setCustomQuestion] = useState("");
  const [activeQuestion, setActiveQuestion] = useState("");
  const [activeAnswer, setActiveAnswer] = useState(null);

  const generatedLabel = useMemo(() => {
    if (!insight?.generatedAt) {
      return "";
    }

    const date = new Date(insight.generatedAt);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [insight?.generatedAt]);

  const handlePresetQuestion = (presetQuestion) => {
    const answer = getValueByPath(
      insight?.presetAnswers || {},
      presetQuestion.key,
    );

    setActiveQuestion(presetQuestion.label);
    setActiveAnswer({
      answer:
        answer ||
        "There is not enough clear review evidence yet to answer that confidently.",
      confidence: "medium",
      basis: [],
    });
  };

  const handleCustomSubmit = async (event) => {
    event.preventDefault();

    const nextQuestion = customQuestion.trim();

    if (!nextQuestion) {
      return;
    }

    const response = await onAskQuestion(nextQuestion);

    if (!response) {
      return;
    }

    setActiveQuestion(nextQuestion);
    setActiveAnswer(response);
    setCustomQuestion("");
  };

  if (isLoading) {
    return (
      <Card className="place-insights">
        <div className="place-insights__loading">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (!insight || insight.status === "empty") {
    return (
      <Card className="place-insights">
        <div className="place-insights__header">
          <div>
            <h2>Review summary</h2>
            <p>
              Once this place gets reviews, the app can summarize them here.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="place-insights">
      <div className="place-insights__header">
        <div>
          <h2>Review summary</h2>
          <p>
            Built from {insight.reviewCount || 0} review
            {(insight.reviewCount || 0) === 1 ? "" : "s"}
            {generatedLabel ? ` · Updated ${generatedLabel}` : ""}
          </p>
        </div>
      </div>

      <div className="place-insights__grid">
        <section className="place-insights__section">
          <h3>Highlights</h3>
          {renderList(
            insight.summary?.highlights,
            "No strong positive themes detected yet.",
          )}
        </section>

        <section className="place-insights__section">
          <h3>Complaints</h3>
          {renderList(
            insight.summary?.complaints,
            "No strong complaint pattern detected yet.",
          )}
        </section>

        <section className="place-insights__section">
          <h3>Vibe</h3>
          <p>
            {insight.summary?.vibe ||
              "The review evidence is still too limited to describe the vibe clearly."}
          </p>
        </section>

        <section className="place-insights__section">
          <h3>Ideal audience</h3>
          {renderList(
            insight.summary?.idealAudience,
            "No clear audience pattern detected yet.",
          )}
        </section>

        <section className="place-insights__section">
          <h3>Tips before visiting</h3>
          {renderList(
            insight.summary?.tipsBeforeVisiting,
            "No consistent practical tips yet.",
          )}
        </section>

        <section className="place-insights__section">
          <h3>Price impression</h3>
          <p>
            {insight.summary?.priceAnswer ||
              "Review evidence is still too limited to judge the price clearly."}
          </p>
        </section>
      </div>

      <div className="place-insights__questions">
        <h3>Quick answers</h3>
        <div className="place-insights__preset-buttons">
          {PRESET_QUESTIONS.map((presetQuestion) => (
            <Button
              key={presetQuestion.key}
              type="button"
              inverse
              onClick={() => handlePresetQuestion(presetQuestion)}
            >
              {presetQuestion.label}
            </Button>
          ))}
        </div>
      </div>

      <form className="place-insights__ask-form" onSubmit={handleCustomSubmit}>
        <label htmlFor="place-ai-question">Have a question?</label>
        <textarea
          id="place-ai-question"
          rows="3"
          value={customQuestion}
          onChange={(event) => setCustomQuestion(event.target.value)}
          placeholder="Example: Is this place good for a quiet study session?"
          maxLength="250"
        />
        <div className="place-insights__ask-actions">
          <span>{customQuestion.trim().length}/250</span>
          <Button type="submit" disabled={!customQuestion.trim() || asking}>
            {asking ? "ASKING..." : "ASK"}
          </Button>
        </div>
      </form>

      {activeAnswer && (
        <div className="place-insights__answer-box">
          <h3>{activeQuestion}</h3>
          <p>{activeAnswer.answer}</p>

          {activeAnswer.basis && activeAnswer.basis.length > 0 && (
            <div className="place-insights__basis">
              <strong>Based on:</strong>
              <ul className="place-insights__list">
                {activeAnswer.basis.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default PlaceInsightsPanel;
