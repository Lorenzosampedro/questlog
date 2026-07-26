"use client";

import { motion } from "motion/react";
import { Tome } from "@/components/tome";

export type ShelfGame = {
  id: string;
  name: string;
  coverUrl: string | null;
  entryCount: number;
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export function TomeShelf({ games }: { games: ShelfGame[] }) {
  return (
    <div className="rounded-2xl bg-gradient-to-b from-amber-900/5 via-amber-900/5 to-amber-950/10 p-8 dark:from-amber-950/20 dark:via-amber-950/10 dark:to-black/40">
      <motion.ul
        className="grid gap-x-6 gap-y-14"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}
        initial="hidden"
        animate="visible"
        variants={listVariants}
      >
        {games.map((game) => (
          <motion.li key={game.id} className="flex justify-center" variants={itemVariants}>
            <Tome
              id={game.id}
              name={game.name}
              coverUrl={game.coverUrl}
              entryCount={game.entryCount}
            />
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
