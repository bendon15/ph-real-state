import { Link } from 'react-router-dom'

export default function About() {
  return (
    <>
      <section className="bg-navy-800 py-20">
        <div className="wrap"><h1 className="max-w-3xl text-5xl font-bold text-white sm:text-6xl">Real estate advice you can act on.</h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">PH Real Estate helps Filipino families, OFWs and investors buy, sell and rent property with clear pricing and honest guidance.</p></div>
      </section>
      <section className="wrap grid gap-12 py-20 md:grid-cols-2">
        <div><h2 className="text-4xl font-bold">Our story</h2>
          <p className="mt-4 leading-relaxed text-slate-600">We started in Metro Manila with a simple goal: make property transactions less stressful. Too many buyers deal with unclear titles, hidden charges and slow replies. We built our team around fixing that.</p>
          <p className="mt-4 leading-relaxed text-slate-600">Today we list residential and commercial properties across Luzon, Visayas and Mindanao, and support clients abroad with virtual viewings and remote document processing.</p></div>
        <dl className="grid grid-cols-2 gap-6 self-start">
          {[['Cities covered', '25+'], ['Properties handled', '1,200+'], ['Licensed agents', '40'], ['Years in business', '12']].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-slate-200 p-6"><dd className="font-display text-4xl font-bold text-gold-dark">{v}</dd><dt className="mt-1 text-sm text-slate-500">{k}</dt></div>
          ))}
        </dl>
      </section>
      <section className="bg-navy-50 py-20"><div className="wrap">
        <h2 className="text-4xl font-bold">How we work</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {[['Transparent', 'You see the full price, fees and requirements before you commit.'], ['Responsive', 'Every inquiry gets a personal reply within one business day.'], ['Accountable', 'Our agents are licensed and stay with you until turnover.']].map(([t, d]) => (
            <div key={t}><h3 className="text-2xl font-bold">{t}</h3><p className="mt-2 text-slate-600">{d}</p></div>
          ))}
        </div></div></section>
      <section className="wrap py-16 text-center"><h2 className="text-4xl font-bold">Ready to start?</h2><Link to="/properties" className="btn-navy mt-6 mr-3">Browse properties</Link><Link to="/contact" className="btn-outline mt-6">Contact us</Link></section>
    </>
  )
}
