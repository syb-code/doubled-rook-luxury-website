#!/usr/bin/env bash
# Localize blog creatives: download from Metricool CDN into assets/blog/
# and rewrite every reference in the blog HTML to the self-hosted copy.
# Run from the repo root:  bash download-creatives.sh
set -euo pipefail
mkdir -p assets/blog

curl -fsSL -o "assets/blog/01-faq-page-cited-by-chatgpt.png" "https://static.metricool.com/common/202605/6242339-mtr_13756425821000743658.png"
curl -fsSL -o "assets/blog/02-agentic-workflow-front-desk-questions.png" "https://static.metricool.com/common/202605/6242339-mtr_12970999653057139454.png"
curl -fsSL -o "assets/blog/03-ga4-gsc-gbp-booking-engine-layering.png" "https://static.metricool.com/common/202605/6242339-mtr_4960824124737230850.png"
curl -fsSL -o "assets/blog/04-5-schema-markup-fields-hotels-miss.png" "https://static.metricool.com/common/202605/6242339-mtr_12500503715924751031.png"
curl -fsSL -o "assets/blog/05-pre-arrival-upsell-ai-workflow.png" "https://static.metricool.com/common/202605/6242339-mtr_15551344612577132067.png"
curl -fsSL -o "assets/blog/06-demand-forecasting-agent.png" "https://static.metricool.com/planner/202606/6158319-file-6361133693889842823.png"
curl -fsSL -o "assets/blog/07-rate-disparity-ota-undercut.png" "https://static.metricool.com/planner/202606/6158319-file-2688229354727562986.png"
curl -fsSL -o "assets/blog/08-personalized-concierge-agent.png" "https://static.metricool.com/planner/202606/6158319-file-4197116016347814981.png"
curl -fsSL -o "assets/blog/09-members-only-rate-parity-safe.png" "https://static.metricool.com/planner/202606/6158319-file-2652300633147820733.png"
curl -fsSL -o "assets/blog/10-cancellation-win-back-agent.png" "https://static.metricool.com/planner/202606/6158319-file-1880560065909572501.png"
curl -fsSL -o "assets/blog/11-retargeting-recover-booking-browsers.png" "https://static.metricool.com/planner/202606/6158319-file-15629236679258034912.png"
curl -fsSL -o "assets/blog/12-multilingual-guest-messaging-agent.png" "https://static.metricool.com/planner/202606/6158319-file-12325197477252938782.png"
curl -fsSL -o "assets/blog/13-pre-arrival-email-first-impression.png" "https://static.metricool.com/planner/202606/6158319-file-3538862648607284452.png"
curl -fsSL -o "assets/blog/14-seasonal-package-builder-agent.png" "https://static.metricool.com/planner/202606/6158319-file-5080687723779256657.png"
curl -fsSL -o "assets/blog/15-google-business-profile-map-pack.png" "https://static.metricool.com/planner/202606/6158319-file-14521711134290501273.png"
curl -fsSL -o "assets/blog/16-in-stay-recovery-agent.png" "https://static.metricool.com/planner/202606/6158319-file-9671673836254373890.png"
curl -fsSL -o "assets/blog/17-first-party-data-ad-audiences.png" "https://static.metricool.com/planner/202606/6158319-file-14275736159251015818.png"
curl -fsSL -o "assets/blog/18-email-segmentation-agent.png" "https://static.metricool.com/planner/202606/6158319-file-789832655236197842.png"
curl -fsSL -o "assets/blog/19-contribution-margin-per-channel.png" "https://static.metricool.com/planner/202606/6158319-file-10018742380129996323.png"
curl -fsSL -o "assets/blog/22-raise-google-rating-with-review-responses.png" "https://static.metricool.com/planner/202607/6158319-file-17147391785321803780.png"
curl -fsSL -o "assets/blog/23-five-agent-automation-stack-for-hotels.png" "https://static.metricool.com/planner/202607/6158319-file-9995122727363369739.png"
curl -fsSL -o "assets/blog/24-three-agent-review-reply-workflow.png" "https://static.metricool.com/planner/202607/6158319-file-15323277835330842441.png"
curl -fsSL -o "assets/blog/25-brand-defense-campaign-for-hotels.png" "https://static.metricool.com/planner/202607/6158319-file-10645495538083698393.png"
curl -fsSL -o "assets/blog/26-rate-shopping-agent-morning-brief.png" "https://static.metricool.com/planner/202607/6158319-file-6006101193582334353.png"
curl -fsSL -o "assets/blog/27-true-cost-of-ota-commission.png" "https://static.metricool.com/planner/202607/6158319-file-10386028704277177552.png"
curl -fsSL -o "assets/blog/28-front-desk-email-triage-agents.png" "https://static.metricool.com/planner/202607/6158319-file-17119896741082138211.png"
curl -fsSL -o "assets/blog/29-pre-arrival-email-sequence.png" "https://static.metricool.com/planner/202607/6158319-file-8281457845591251251.png"
curl -fsSL -o "assets/blog/30-personalized-upsell-agent.png" "https://static.metricool.com/planner/202607/6158319-file-17410057121807556435.png"
curl -fsSL -o "assets/blog/31-get-cited-by-ai-assistants-aeo.png" "https://static.metricool.com/planner/202607/6158319-file-3931895038281163561.png"
curl -fsSL -o "assets/blog/32-pre-stay-concierge-agent.png" "https://static.metricool.com/planner/202607/6158319-file-14437690889504043693.png"
curl -fsSL -o "assets/blog/33-metasearch-google-hotel-ads.png" "https://static.metricool.com/planner/202607/6158319-file-16582181371087385598.png"
curl -fsSL -o "assets/blog/34-abandoned-booking-recovery-agent.png" "https://static.metricool.com/planner/202607/6158319-file-17226806824091770924.png"
curl -fsSL -o "assets/blog/35-booking-engine-conversion-cro.png" "https://static.metricool.com/planner/202607/6158319-file-1947758875831346055.png"
curl -fsSL -o "assets/blog/36-review-analysis-agent-ranked-fixes.png" "https://static.metricool.com/planner/202607/6158319-file-9210960383234645724.png"
curl -fsSL -o "assets/blog/37-hotel-marketing-attribution-blind-spot.png" "https://static.metricool.com/planner/202607/6158319-file-16653691274337551931.png"

# Swap CDN URLs for self-hosted absolute URLs across the blog pages
sed -i 's|https://static.metricool.com/common/202605/6242339-mtr_13756425821000743658.png|https://www.doubledrook.com/assets/blog/01-faq-page-cited-by-chatgpt.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/common/202605/6242339-mtr_12970999653057139454.png|https://www.doubledrook.com/assets/blog/02-agentic-workflow-front-desk-questions.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/common/202605/6242339-mtr_4960824124737230850.png|https://www.doubledrook.com/assets/blog/03-ga4-gsc-gbp-booking-engine-layering.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/common/202605/6242339-mtr_12500503715924751031.png|https://www.doubledrook.com/assets/blog/04-5-schema-markup-fields-hotels-miss.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/common/202605/6242339-mtr_15551344612577132067.png|https://www.doubledrook.com/assets/blog/05-pre-arrival-upsell-ai-workflow.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202606/6158319-file-6361133693889842823.png|https://www.doubledrook.com/assets/blog/06-demand-forecasting-agent.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202606/6158319-file-2688229354727562986.png|https://www.doubledrook.com/assets/blog/07-rate-disparity-ota-undercut.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202606/6158319-file-4197116016347814981.png|https://www.doubledrook.com/assets/blog/08-personalized-concierge-agent.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202606/6158319-file-2652300633147820733.png|https://www.doubledrook.com/assets/blog/09-members-only-rate-parity-safe.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202606/6158319-file-1880560065909572501.png|https://www.doubledrook.com/assets/blog/10-cancellation-win-back-agent.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202606/6158319-file-15629236679258034912.png|https://www.doubledrook.com/assets/blog/11-retargeting-recover-booking-browsers.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202606/6158319-file-12325197477252938782.png|https://www.doubledrook.com/assets/blog/12-multilingual-guest-messaging-agent.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202606/6158319-file-3538862648607284452.png|https://www.doubledrook.com/assets/blog/13-pre-arrival-email-first-impression.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202606/6158319-file-5080687723779256657.png|https://www.doubledrook.com/assets/blog/14-seasonal-package-builder-agent.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202606/6158319-file-14521711134290501273.png|https://www.doubledrook.com/assets/blog/15-google-business-profile-map-pack.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202606/6158319-file-9671673836254373890.png|https://www.doubledrook.com/assets/blog/16-in-stay-recovery-agent.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202606/6158319-file-14275736159251015818.png|https://www.doubledrook.com/assets/blog/17-first-party-data-ad-audiences.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202606/6158319-file-789832655236197842.png|https://www.doubledrook.com/assets/blog/18-email-segmentation-agent.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202606/6158319-file-10018742380129996323.png|https://www.doubledrook.com/assets/blog/19-contribution-margin-per-channel.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202607/6158319-file-17147391785321803780.png|https://www.doubledrook.com/assets/blog/22-raise-google-rating-with-review-responses.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202607/6158319-file-9995122727363369739.png|https://www.doubledrook.com/assets/blog/23-five-agent-automation-stack-for-hotels.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202607/6158319-file-15323277835330842441.png|https://www.doubledrook.com/assets/blog/24-three-agent-review-reply-workflow.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202607/6158319-file-10645495538083698393.png|https://www.doubledrook.com/assets/blog/25-brand-defense-campaign-for-hotels.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202607/6158319-file-6006101193582334353.png|https://www.doubledrook.com/assets/blog/26-rate-shopping-agent-morning-brief.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202607/6158319-file-10386028704277177552.png|https://www.doubledrook.com/assets/blog/27-true-cost-of-ota-commission.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202607/6158319-file-17119896741082138211.png|https://www.doubledrook.com/assets/blog/28-front-desk-email-triage-agents.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202607/6158319-file-8281457845591251251.png|https://www.doubledrook.com/assets/blog/29-pre-arrival-email-sequence.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202607/6158319-file-17410057121807556435.png|https://www.doubledrook.com/assets/blog/30-personalized-upsell-agent.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202607/6158319-file-3931895038281163561.png|https://www.doubledrook.com/assets/blog/31-get-cited-by-ai-assistants-aeo.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202607/6158319-file-14437690889504043693.png|https://www.doubledrook.com/assets/blog/32-pre-stay-concierge-agent.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202607/6158319-file-16582181371087385598.png|https://www.doubledrook.com/assets/blog/33-metasearch-google-hotel-ads.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202607/6158319-file-17226806824091770924.png|https://www.doubledrook.com/assets/blog/34-abandoned-booking-recovery-agent.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202607/6158319-file-1947758875831346055.png|https://www.doubledrook.com/assets/blog/35-booking-engine-conversion-cro.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202607/6158319-file-9210960383234645724.png|https://www.doubledrook.com/assets/blog/36-review-analysis-agent-ranked-fixes.png|g' blog/*.html blog.html sitemap.xml
sed -i 's|https://static.metricool.com/planner/202607/6158319-file-16653691274337551931.png|https://www.doubledrook.com/assets/blog/37-hotel-marketing-attribution-blind-spot.png|g' blog/*.html blog.html sitemap.xml
echo "Done. Creatives localized to assets/blog/ and references updated."
