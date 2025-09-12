
This project is funded through [NGI0 Commons Fund](https://nlnet.nl/commonsfund), a fund established by [NLnet](https://nlnet.nl/) with financial support from the [European Commission's Next Generation Internet program](https://ngi.eu/). See also the [NLnet project page](https://nlnet.nl/project/SolidOS/).

The final project plan is a bit changed from the original application. See the project goals [here]().
A project board with issues tracking is [here](https://github.com/orgs/SolidOS/projects/2/views/7).

# Application to NGI0 Commons Fund established by NLnet

## Abstract: Can you explain the whole project and its expected outcome(s). (1200 characters)

SolidOS is envisioned as a full-featured web-based operating system for any Solid-compliant personal data store, offering a window into Sir Tim Berners-Lee’s vision for a decentralized web. It serves as the default frontend for servers like solidcommunity.net and solidweb.org—often the first encounter new users have with Solid. 
However, its current interface is unintuitive, outdated, and difficult to navigate—even for its maintainers. With over 60,000 accounts on solidcommunity.net alone by the end of 2024, poor UX has become a major barrier to adoption, contribution, and inclusivity.
This project will deliver a modern, modularized SolidOS frontend with a streamlined CSS theme and clearly defined user-friendly "happy paths”. To achieve this, we will restructure the backend for better integration with panes and web components, improving maintainability, onboarding, and participation at scale. The result: a more welcoming, intuitive, and extensible entry point to the Solid ecosystem.

Have you been involved with projects or organisations relevant to this project before? And if so, can you tell us a bit about your contributions? (2500)

Timea Turdean: Timea worked on SolidOS at Inrupt from 2021 to 2022, later transitioning to the Enterprise Solid Server team. Despite the move, she continued to contribute to the SolidOS project as a volunteer, driven by her commitment to open-source and the Solid vision. During her time with the SolidOS team, she took on the role of Engineering Manager, leading major backend refactoring efforts and contributing across documentation, project management, recruitment, and collaborative roadmap development.
Timea played a key role in aligning backend architecture to support a more robust and user-friendly UI. In parallel, she created a Solid-powered onboarding site for newcomers: HelloWorld, and actively promoted Solid and SolidOS at various conferences. She also served as Chair of Solid World, the monthly event where community members showcase their work.
With a degree in Computer Science and an MBA in General Management, Timea brings over a decade of diverse experience in tech—as an entrepreneur, consultant, software engineer, and researcher—offering a unique blend of technical and strategic leadership.

## Explain what the requested budget will be used for? Does the project have other funding sources, both past and present? (If you want, you can in addition attach a budget at the bottom of the form) (2500)

Total Budget: €50,000
Rate: €50/hour
Total Hours: 1,000

Budget Allocation:
- Backend Development – 200h / €10,000
Focused refactoring to support modularity. After these milestones, panes can be added easily to SolidOS, technically, and will make it easy to build in other standards, like ActivityPods.
- Frontend: Core Style – 240h / €12,000
Streamlined CSS theme with generic reusable components. After this milestone, developers will have an easy to use style they can use for new panes to keep the SolidOS look and feel.
- Frontend: Panes – 260h / €13,000
Modernizing existing panes and aligning them with the new UI design. After this milestone developers will have dedicated examples of already fully functional panes. Users of SolidOS will have an easier time using SolidOS.
- Developer Documentation – 140h / €7,000
Technical guides for consistent pane development and styling. After this milestone, developers do not need to look into pane code to understand how to make a new pane, but will have proper documentation.
- User Documentation – 160h / €8,000
User-friendly guides and happy path flows to support digital literacy. After this goal, users can check the new updated SolidOS user guide for in-depth clarifications on how to use SolidOS and examples of main use cases.
This plan supports a more inclusive, usable, and human-centered SolidOS. For example, this work will also make it easier to add compatibility with new specs, including AP with ActivityPods which we plan to do once ActivityPods has improved Solid compatibility later in 2025.
In the past, Inrupt (Sir Tim Berners-Lee’s company) hired one person to work specifically on this project alongside Sir Tim. This was the case up until 2022. Since then the project did not receive any funding.
 
## Compare your own project with existing or historical efforts. (4000)

The SolidOS project includes a module called solid-ui, originally envisioned as a reusable UI library for the broader Solid ecosystem. It was intended to offer a consistent set of core components styled with a default Solid look and feel—components that could be easily imported and extended across applications. Unfortunately, this vision remains only partially realized. While solid-ui does include a basic Storybook, it is currently broken and lacks proper maintenance.
Elsewhere in the SolidOS codebase, components follow a completely different styling system based on so-called RDF forms. This part of the code defines HTML components and their styling through RDF-based configuration. However, the CSS capabilities in this part of the code are quite limited, which results in the current SolidOS configuration dashboard appearing visually outdated and overly simplistic.
Despite these limitations, the RDF forms concept has inspired further exploration. Notable community efforts include Jeff Zucker’s solid-web-components library and Angelo Velten’s PodOS project—both of which build on the idea of Solid-native web components to improve modularity and reusability within the ecosystem.

## What are significant technical challenges you expect to solve during the project, if any? (5000)

A streamlined theme and modular architecture will significantly improve the SolidOS user interface.
SolidOS is built with JavaScript and TypeScript, but unlike modern frameworks like React or Angular, it doesn’t use component-based architecture. Instead, it relies on panes—modular sections of the UI—such as the profile, contacts, file explorer, address book, bookmarks, configuration, and task tracker.
Currently, these panes are loaded through an outdated system called the pane-registry, which is due for replacement. We aim to introduce a more flexible, dynamic solution that allows users to customize their dashboard by selecting which panes (or components) they want to see. In this area, we take inspiration from Jeff Zucker’s web components and Angelo Veltens’ PodOS, which demonstrate more modern approaches to modularity (see links above).
Additionally, the existing SolidOS theme needs to be streamlined and consistently applied across all panes. Ideally, this unified style should also be easy to apply to external components—like Jeff’s web components—to promote reusability across the Solid ecosystem. Finally, we plan to consider reviving and updating the existing Storybook to support easier development and documentation.

Describe the ecosystem of the project, and how you will engage with relevant actors and promote the outcomes? (2500)
SolidOS, formerly known as Mashlib, was rebranded when the Node Solid Server (NSS) backend was decoupled from its frontend. What remains is the standalone frontend—SolidOS—built on top of Solid libraries. It is now the official frontend of the solidcommunity.net server.
The SolidOS project received its dedicated GitHub organisation in 2022, following the consolidation of related efforts under the Solid and solid-contrib GitHub organizations. The core volunteer team behind SolidOS is active across multiple Solid projects and works closely with the broader Solid ecosystem.
The responsibilities managed by the Solid Team, including managing core resources like the Solid website, forum, and server infrastructure—were transitioned to the Open Data Institute (ODI) in October 2024. SolidOS is outside the scope of the core repositories that the ODI is responsible for and thus is not currently receiving support.

GitHub: https://github.com/SolidOS
Webpage: https://solidos.solidcommunity.net
Matrix channel: #solid_solidos:gitter.im
Team meetings: Held every Wednesday and documented here
Roadmap & onboarding: https://github.com/SolidOS/solidos


## Community Communication & Project Promotion
All updates to SolidOS and its integration with community servers are transparently communicated through Solid’s main channels—Matrix and the Solid forum. Users logging into their solidcommunity.net accounts will also see updates reflected directly in the interface.
Updates are shared widely by SolidOS contributors and meeting participants, with discussions remaining open and visible on GitHub and the Matrix channel.
Rollout Plan for Upcoming Changes
As this project introduces significant frontend improvements, we will roll out changes gradually, ensuring adequate time to gather user feedback at each stage.
For example, updating the look and feel of the profile dashboard would follow these steps:
Prepare a mockup and present it to the SolidOS team.
Collect initial feedback and implement changes.
Deploy updates to a test server.
Gather feedback from the SolidOS team, the broader community via the Matrix channel #solid_solidcommunity.net:gitter.im, and the Solid Team.
Refine the implementation based on input.
Roll out the final version to production.
This approach ensures inclusivity, transparency, and alignment with the needs of the Solid community.
