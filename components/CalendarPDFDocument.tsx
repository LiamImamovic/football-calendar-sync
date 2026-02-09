"use client";

import type { CalendarEvent } from "@/types/database";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

/* Couleurs par défaut SaaS (indigo) — surchargées par les couleurs du club si fournies */
const DEFAULT_PRIMARY = "#6366f1";
const DEFAULT_ACCENT = "#a5b4fc";
const WHITE = "#FFFFFF";
const TEXT_DARK = "#1f2937";
const BORDER = "#e5e7eb";

const MAX_EVENTS_ONE_PAGE = 18;

function createStyles(primary: string, accent: string) {
  return StyleSheet.create({
    page: {
      padding: 20,
      fontFamily: "Helvetica",
      backgroundColor: WHITE,
    },
    header: {
      alignItems: "center",
      marginBottom: 10,
    },
    logo: {
      width: 48,
      height: 48,
      objectFit: "contain",
      marginBottom: 6,
    },
    title: {
      fontSize: 16,
      fontWeight: "bold",
      color: primary,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 8,
      color: "#6b7280",
      marginBottom: 4,
    },
    accentBar: {
      width: 80,
      height: 2,
      backgroundColor: accent,
      alignSelf: "center",
    },
    table: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: 2,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: primary,
      color: WHITE,
      fontSize: 8,
      fontWeight: "bold",
    },
    tableHeaderCellDate: { padding: 5, width: 52 },
    tableHeaderCellTime: { padding: 5, width: 32 },
    tableHeaderCellMatch: { padding: 5, flex: 2 },
    tableHeaderCellLocation: { padding: 5, flex: 2 },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: BORDER,
      fontSize: 7,
      color: TEXT_DARK,
    },
    tableRowLast: {
      flexDirection: "row",
      fontSize: 7,
      color: TEXT_DARK,
    },
    tableCellDate: { padding: 4, width: 52 },
    tableCellTime: { padding: 4, width: 32 },
    tableCellMatch: { padding: 4, flex: 2 },
    tableCellLocation: { padding: 4, flex: 2 },
    empty: {
      padding: 12,
      textAlign: "center",
      color: "#6b7280",
      fontSize: 8,
    },
    moreText: {
      padding: 6,
      textAlign: "center",
      color: "#6b7280",
      fontSize: 7,
      fontStyle: "italic",
    },
    footer: {
      position: "absolute",
      bottom: 12,
      left: 20,
      right: 20,
      flexDirection: "row",
      justifyContent: "center",
      borderTopWidth: 1,
      borderTopColor: BORDER,
      paddingTop: 6,
    },
    footerText: {
      fontSize: 6,
      color: "#9ca3af",
    },
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  teamName: string;
  events: CalendarEvent[];
  /** Data URL (data:image/png;base64,...) pour afficher le logo dans le PDF */
  logoDataUrl: string | null;
  /** Couleur principale du club (hex). Par défaut : indigo SaaS */
  primaryColor?: string | null;
  /** Couleur secondaire du club (hex). Par défaut : indigo clair SaaS */
  secondaryColor?: string | null;
  /** Nom du club, affiché dans le footer */
  clubName?: string | null;
};

export function CalendarPDFDocument({
  teamName,
  events,
  logoDataUrl,
  primaryColor,
  secondaryColor,
  clubName,
}: Props) {
  const primary = primaryColor || DEFAULT_PRIMARY;
  const accent = secondaryColor || DEFAULT_ACCENT;
  const styles = createStyles(primary, accent);

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const eventsToShow = sortedEvents.slice(0, MAX_EVENTS_ONE_PAGE);
  const remainingCount = sortedEvents.length - eventsToShow.length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {logoDataUrl ? (
            <Image src={logoDataUrl} style={styles.logo} />
          ) : (
            <View style={[styles.logo, { backgroundColor: BORDER }]} />
          )}
          <Text style={styles.title}>Calendrier {teamName}</Text>
          <Text style={styles.subtitle}>À imprimer et garder sur le frigo</Text>
          <View style={styles.accentBar} />
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCellDate}>Date</Text>
            <Text style={styles.tableHeaderCellTime}>Heure</Text>
            <Text style={styles.tableHeaderCellMatch}>Match</Text>
            <Text style={styles.tableHeaderCellLocation}>Lieu</Text>
          </View>
          {eventsToShow.length === 0 ? (
            <Text style={styles.empty}>
              Aucun match programmé pour l&apos;instant.
            </Text>
          ) : (
            eventsToShow.map((ev, i) => (
              <View
                key={ev.id}
                style={
                  i === eventsToShow.length - 1
                    ? styles.tableRowLast
                    : styles.tableRow
                }
              >
                <Text style={styles.tableCellDate}>{formatDate(ev.date)}</Text>
                <Text style={styles.tableCellTime}>{formatTime(ev.date)}</Text>
                <Text style={styles.tableCellMatch}>
                  {ev.is_home
                    ? `Nous vs ${ev.opponent}`
                    : `${ev.opponent} vs Nous`}
                </Text>
                <Text style={styles.tableCellLocation}>{ev.location}</Text>
              </View>
            ))
          )}
          {remainingCount > 0 && (
            <Text style={styles.moreText}>
              … et {remainingCount} autre{remainingCount > 1 ? "s" : ""} match
              {remainingCount > 1 ? "s" : ""} (voir le calendrier en ligne)
            </Text>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            &bull; {clubName || "Football Calendar Sync"} &bull;
          </Text>
        </View>
      </Page>
    </Document>
  );
}
