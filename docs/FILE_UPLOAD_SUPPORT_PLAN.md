## Upload Support Plan

- **Allowed types**: `pdf`, `docx`, `doc`, `rtf`, `txt`; optionally `png`, `jpg` if image uploads are needed.
- **File size limit**: 5–10 MB enforced client-side and server-side; show clear error feedback and log rejected uploads for tuning.
- **Storage**: store binary content in object storage (Supabase Storage, S3, Azure Blob, etc.); database keeps metadata only (`storage_path`, `original_name`, `mime_type`, `size_bytes`, `uploaded_by`, timestamps, status).

### Database Changes

- Create a `job_user_files` (or similar) table with:
  - `id` (PK)
  - `job_id` / `user_id` (FKs)
  - `storage_path`
  - `original_name`
  - `mime_type`
  - `size_bytes`
  - `uploaded_at`
  - `status`
  - optional `file_role` for resume/portfolio distinctions
- Add Prisma/TypeORM/Supabase migrations to materialize the table and foreign keys.

### TypeScript/API Updates

- Extend the relevant API handler to accept `multipart/form-data`, validate mime/size, upload to storage, persist metadata, and return file info.
- Add/adjust client uploader UI (`<input type="file" accept=".pdf,.doc,.docx,.rtf,.txt">`), handle previews/status, surface validation errors.
- Update shared types/interfaces (e.g., `JobApplicationPayload`) and any Zod/Yup schemas to include attachment metadata.

### Operational Considerations

- Sanitize filenames, optionally virus-scan uploads, and deliver downloads via signed URLs.
- Add tests covering size limits, allowed/blocked mime types, and end-to-end flows with mocked storage.

