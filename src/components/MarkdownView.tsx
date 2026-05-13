import { StyleSheet } from "react-native";
import Markdown, { type RenderRules } from "react-native-markdown-display";
import { colors, fontSize, spacing } from "@/src/theme";

interface MarkdownViewProps {
  content: string;
}

export function MarkdownView({ content }: MarkdownViewProps) {
  return (
    <Markdown style={markdownStyles} rules={rules}>
      {content}
    </Markdown>
  );
}

const rules: RenderRules = {};

const markdownStyles = StyleSheet.create({
  body: {
    color: colors.foreground,
    fontSize: fontSize.base,
    lineHeight: 22,
  },
  heading1: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    color: colors.foreground,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  heading2: {
    fontSize: fontSize.xl,
    fontWeight: "600",
    color: colors.foreground,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  heading3: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.foreground,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: spacing.sm,
    color: colors.foreground,
  },
  strong: { fontWeight: "600" },
  em: { fontStyle: "italic" },
  list_item: { color: colors.foreground },
  bullet_list: { marginBottom: spacing.sm },
  ordered_list: { marginBottom: spacing.sm },
  code_inline: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  code_block: {
    backgroundColor: colors.secondary,
    padding: spacing.sm,
    borderRadius: 6,
    color: colors.primary,
  },
  fence: {
    backgroundColor: colors.secondary,
    padding: spacing.sm,
    borderRadius: 6,
    color: colors.primary,
  },
  blockquote: {
    backgroundColor: colors.secondary,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
    marginVertical: spacing.sm,
  },
  hr: { backgroundColor: colors.border, height: 1, marginVertical: spacing.md },
  link: { color: colors.info, textDecorationLine: "underline" },
});
