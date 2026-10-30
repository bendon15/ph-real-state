import InquiryForm from '../components/InquiryForm'

export default function Contact() {
  return (
    <div className="wrap grid gap-14 py-16 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <h1 className="text-5xl font-bold">Contact us</h1>
        <p className="mt-4 max-w-md leading-relaxed text-slate-600">Tell us what you are looking for, whether buying, selling or renting. An agent will reply within one business day.</p>
        <dl className="mt-10 space-y-6 text-sm">
          <div><dt className="font-semibold text-navy-800">Office</dt><dd className="mt-1 text-slate-600">Bonifacio Global City, Taguig, Metro Manila</dd></div>
          <div><dt className="font-semibold text-navy-800">Office hours</dt><dd className="mt-1 text-slate-600">Monday to Saturday, 9:00 AM to 6:00 PM (PHT)</dd></div>
        </dl>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><InquiryForm type="contact" /></div>
    </div>
  )
}
