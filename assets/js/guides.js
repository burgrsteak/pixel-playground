/* ============================================================================
   guides.js — per-event placement rules, shared by the console Guide tab
   and by codegen.js for comment blocks in generated code.

   Each entry has:
     where    — the correct firing point
     why      — the reason it has to be there
     mistake  — the single most common error for this event
     link     — Snap Business Help Center URL
   ========================================================================= */

var SPX_GUIDES = {

  PAGE_VIEW: {
    where:   'Immediately after snaptr(\'init\') on every page.',
    why:     'PAGE_VIEW is the base signal for retargeting audiences. Missing pages silently shrink your addressable audience.',
    mistake: 'Firing only on the home page. Audiences built on PAGE_VIEW then only re-target home-page visitors.',
    link:    'https://businesshelp.snapchat.com/s/article/pixel-standard-events'
  },

  LIST_VIEW: {
    where:   'After the product grid renders, with the SKUs visible on that page.',
    why:     'LIST_VIEW feeds Dynamic Ads. item_ids must be the SKUs actually rendered, not the whole catalog.',
    mistake: 'Sending the full catalog SKU list instead of only the items visible on the current page. On a paginated collection this inflates every list view.',
    link:    'https://businesshelp.snapchat.com/s/article/pixel-standard-events'
  },

  SEARCH: {
    where:   'Once, when results have rendered.',
    why:     'Fires once per search, not per keystroke. search_string is stored but not a reportable column in Events Manager.',
    mistake: 'Wiring to a type-ahead input event. Produces one event per keystroke and makes the count meaningless.',
    link:    'https://businesshelp.snapchat.com/s/article/pixel-standard-events'
  },

  VIEW_CONTENT: {
    where:   'On page load of the product detail page.',
    why:     'The strongest mid-funnel signal. Dynamic Ads retargeting audiences are mostly built on this event.',
    mistake: 'Firing on every variant click. Decide once whether a variant change is a new VIEW_CONTENT and stay consistent.',
    link:    'https://businesshelp.snapchat.com/s/article/pixel-standard-events'
  },

  SAVE: {
    where:   'When the user saves an item to a wishlist or saved-for-later list.',
    why:     'Separate intent signal from ADD_CART. Mixing them corrupts cart-value reporting.',
    mistake: 'Reusing ADD_CART for wishlist actions. SAVE has no price parameter, which is the hint that no purchase intent has been expressed yet.',
    link:    'https://businesshelp.snapchat.com/s/article/pixel-standard-events'
  },

  ADD_CART: {
    where:   'In the success callback of the cart mutation, not in the click handler.',
    why:     'Firing in the click handler counts out-of-stock failures and network errors as adds.',
    mistake: 'Firing on the click event before the cart request completes. Also: inconsistent price — decide whether price is unit or line total.',
    link:    'https://businesshelp.snapchat.com/s/article/pixel-standard-events'
  },

  START_CHECKOUT: {
    where:   'Once, when the first checkout step renders.',
    why:     'Fires once per checkout attempt. Firing on every step of a multi-step checkout multiplies the count by the number of steps.',
    mistake: 'Firing on every checkout step. A four-step checkout then reports four times the real number of checkout starts.',
    link:    'https://businesshelp.snapchat.com/s/article/pixel-standard-events'
  },

  ADD_BILLING: {
    where:   'When payment information is successfully attached.',
    why:     'The last event before PURCHASE — the sharpest predictor of intent.',
    mistake: 'Firing when the payment form renders rather than when billing details are confirmed. Every page view then counts as a billing add.',
    link:    'https://businesshelp.snapchat.com/s/article/pixel-standard-events'
  },

  SIGN_UP: {
    where:   'After the server confirms the account was created.',
    why:     'Firing in the form submit handler counts validation failures, duplicate emails and abandoned confirmations as conversions.',
    mistake: 'Firing on form submit instead of on server confirmation. sign_up_method and success are accepted but not reportable columns.',
    link:    'https://businesshelp.snapchat.com/s/article/pixel-standard-events'
  },

  PURCHASE: {
    where:   'On the order confirmation page, after the order is placed.',
    why:     'transaction_id is what lets Snap deduplicate confirmation-page refreshes. Without it every refresh counts as new revenue.',
    mistake: 'Omitting transaction_id. Also: sending price in cents (Shopify stores money in cents — divide by 100).',
    link:    'https://businesshelp.snapchat.com/s/article/pixel-standard-events'
  }

};
