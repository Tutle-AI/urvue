CREATE INDEX "ConversationAnalysis_sentiment_idx" ON "ConversationAnalysis"("sentiment");
CREATE INDEX "AnalysisFinding_kind_label_idx" ON "AnalysisFinding"("kind", "label");
