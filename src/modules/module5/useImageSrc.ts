import { useQuery } from '@tanstack/react-query'
import { visitImageService } from '@/services/visitImageService'
import { visitImageKeys } from './useVisitImages'

/**
 * Fetches image base64 data via GAS proxy and returns a data URI for <img>.
 * Falls back to empty string while loading or on error.
 */
export function useImageSrc(imageId: string | null) {
  const { data: dataUri, isLoading, isError } = useQuery({
    queryKey: [...visitImageKeys.all, 'serve', imageId],
    queryFn: async () => {
      if (!imageId) return ''
      const result = await visitImageService.serve(imageId)
      return `data:${result.mimeType};base64,${result.base64}`
    },
    enabled: !!imageId,
    // Cache aggressively — images don't change
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000, // 30 min
  })

  return {
    src: dataUri ?? '',
    isLoading,
    isError,
  }
}
