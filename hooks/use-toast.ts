/**
 * This file now re-exports toast from sonner for backward compatibility.
 * All toast notifications in this project now use Sonner instead of a custom implementation.
 *
 * Usage:
 * - toast('Simple message')
 * - toast.success('Title', { description: 'Description' })
 * - toast.error('Title', { description: 'Description' })
 * - toast.loading('Loading...')
 * - toast.info('Info', { description: 'Description' })
 * - toast.warning('Warning', { description: 'Description' })
 */

export { toast } from "sonner";
