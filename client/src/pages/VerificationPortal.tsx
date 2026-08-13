/**
 * Verification Portal Page
 *
 * The route remains available for existing links, but verification is disabled
 * until report hashes and signatures can be validated deterministically.
 */

export default function VerificationPortal() {
  return (
    <div className="max-w-lg mx-auto mt-16 text-center px-6">
      <h1 className="text-2xl font-semibold mb-4">Report Verification</h1>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-left">
        <p className="font-medium text-amber-800 mb-2">Coming Soon</p>
        <p className="text-sm text-amber-700">
          Cryptographic report verification is not yet available. This feature will allow anyone to
          verify that a CodeComply report has not been modified since it was generated.
        </p>
        <p className="text-sm text-amber-700 mt-3">
          Until then, treat all CodeComply reports as preliminary compliance assistance documents.
          They must be independently reviewed by a licensed professional before permit submission.
        </p>
      </div>
    </div>
  );
}
