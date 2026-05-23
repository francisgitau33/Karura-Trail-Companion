"use client";

interface FooterProps {
  contactEmail: string;
}

export default function Footer({ contactEmail }: FooterProps) {
  const email = contactEmail.trim();

  return (
    <footer className="site-footer">
      {email ? (
        <p>
          For enquiries or support:{' '}
          <a href={`mailto:${email}`}>{email}</a>
        </p>
      ) : (
        <p>Contact details will be added soon.</p>
      )}
    </footer>
  );
}
