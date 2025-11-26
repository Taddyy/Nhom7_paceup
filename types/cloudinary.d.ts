declare module 'cloudinary' {
  // We only use the runtime SDK in server-side utilities.
  // Rely on the package's own typings if available at runtime,
  // otherwise fall back to `any` to satisfy TypeScript during build.
  export const v2: any
  export type UploadApiErrorResponse = any
  export type UploadApiResponse = any
}


