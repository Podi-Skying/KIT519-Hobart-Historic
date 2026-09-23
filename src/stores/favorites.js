import { defineStore } from 'pinia'
import { SITES } from '@/data/sites'
import { rankByLikes } from '@/lib/sites'

/** Sites the user has liked. Like counts = seed count + the user's own like. */
export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    /** @type {number[]} */
    likedIds: [],
  }),

  getters: {
    isLiked: (state) => (siteId) => state.likedIds.includes(siteId),
    likeCount() {
      return (site) => site.baseLikes + (this.isLiked(site.id) ? 1 : 0)
    },
    rankedSites() {
      return rankByLikes(SITES, this.likeCount)
    },
  },

  actions: {
    toggle(siteId) {
      this.likedIds = this.isLiked(siteId)
        ? this.likedIds.filter((id) => id !== siteId)
        : [...this.likedIds, siteId]
    },
  },

  persist: { paths: ['likedIds'], version: 2 },
})
