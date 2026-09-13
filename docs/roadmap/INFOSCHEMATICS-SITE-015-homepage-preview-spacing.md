---
id: INFOSCHEMATICS-SITE-015
area: SITE
title: Homepage preview spacing
theme: site-experience
horizon: soon
status: draft
blocks: []
blocked_by: []
baseline_ref: null
---

# Homepage preview spacing

## Goal

Give the homepage Infoschematic enough vertical breathing room that its Inputs and Outputs framing remains legible while the preview still dissolves naturally into the page.

## Context

The homepage displays a 1268 by 408 static SVG behind a vertical edge mask. The authored Regions begin close to the view-box edge, so their labels and upper and lower frames enter the fade before the diagram's central content and can appear clipped or lost.

## Boundary

This item does not redesign the homepage composition, change its copy, alter the Infoschematic's concepts, or introduce a reusable renderer treatment unless visual inspection shows the issue originates below Site.

## Shaping

Compare Site-owned wrapper spacing and mask-stop changes with additional authored view-box breathing room. Prefer the smallest Site-owned adjustment that preserves the edge blend, responsive fit, and footer spacing. Promote to Next once the treatment and desktop and narrow visual acceptance views are named.

## Discussion

### Ownership

The fade belongs to the homepage outlet, so wrapper or mask spacing is the default home. Change authored diagram geometry only if the diagram is intrinsically cramped outside the homepage.

### Visual acceptance

Inputs and Outputs labels and their top and bottom frames should remain readable at desktop and narrow widths, while the preview should still feel embedded rather than boxed.
