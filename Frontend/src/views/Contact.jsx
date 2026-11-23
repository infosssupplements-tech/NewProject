import PageHeader from "../components/PageHeader.jsx";
import ContactForm from "../components/ContactForm.jsx";

export default function Contact() {
  return (
    <>
      <PageHeader eyebrow="Contact us" title="Let's talk about" accent="understanding.">
        Whether you&apos;re a student, a teacher or a team building with documents — we&apos;d love to hear from you.
      </PageHeader>
      <section className="bg-cream py-20 text-ink md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
