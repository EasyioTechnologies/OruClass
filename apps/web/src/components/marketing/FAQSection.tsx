export function FAQSection({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white" id="faq">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-100" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
              <h3 className="text-xl font-semibold text-gray-900 mb-3" itemProp="name">{faq.question}</h3>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p className="text-gray-600 leading-relaxed" itemProp="text">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
