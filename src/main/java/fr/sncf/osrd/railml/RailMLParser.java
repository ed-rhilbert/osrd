package fr.sncf.osrd.railml;

import fr.sncf.osrd.infra.InvalidInfraException;

import fr.sncf.osrd.infra.railjson.schema.RJSRoot;
import fr.sncf.osrd.infra.railjson.schema.RJSTrackSection;
import fr.sncf.osrd.utils.XmlNamespaceCleaner;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

public final class RailMLParser {
    static final Logger logger = LoggerFactory.getLogger(RailMLParser.class);

    /**
     * Initialises a new infrastructure from a RailML file.
     * @return the parsed infrastructure
     */
    public static RJSRoot parse(String inputPath) throws InvalidInfraException {
        Document document;
        try {
            document = new SAXReader().read(inputPath);
        } catch (DocumentException e) {
            throw new InvalidInfraException("invalid XML", e);
        }

        // remove xml namespace tags, as these prevent using xpath
        document.accept(new XmlNamespaceCleaner());

        // create RMLGraph
        var graph = new RMLGraph();

        // parse the description level of netElements
        var descLevels = parseDescriptionLevels(document);

        // parse all net relations in the document (relations between pieces of track)
        var netRelations = NetRelation.parse(descLevels, document);

        // parse pieces of track, and add those to the json document
        var netElements = NetElement.parse(descLevels, document, graph);

        // fill NetRelation in the RMLGraph
        for (var rjsTrackSectionLink : netRelations.values()) {
            var netRelation = NetRelation.fromTrackSectionLink(rjsTrackSectionLink, netElements);
            netRelation.begin.getEndpointRelations(netRelation.beginEndpoint).add(netRelation);
            netRelation.end.getEndpointRelations(netRelation.endEndpoint).add(netRelation);
        }

        // create RailJSON track sections for all micro netElements
        var rjsTrackSections = new HashMap<String, RJSTrackSection>();
        for (var netElement : netElements.values()) {
            // skip groups of netElements (macro or meso)
            if (netElement.getClass() != TrackNetElement.class)
                continue;
            var trackNetElement = (TrackNetElement) netElement;
            var rjsTrackSection = new RJSTrackSection(trackNetElement.id, trackNetElement.length);
            rjsTrackSections.put(rjsTrackSection.id, rjsTrackSection);
        }

        // create and fill the root RailJSON structure
        var rjsOperationalPoints = RMLOperationalPoint.parse(netElements, document, rjsTrackSections);
        var rjsSpeedSections = RMLSpeedSection.parse(netElements, document, rjsTrackSections);
        var rjsTvdSections = RMLTVDSection.parse(netElements, document, rjsTrackSections);
        var rjsSwitches = RMLSwitchIS.parse(netElements, netRelations, document);
        var rjsRoutes = RMLRoute.parse(document);
        RMLBufferStop.parse(netElements, document, rjsTrackSections);
        RMLTrainDetectionElement.parse(netElements, document, rjsTrackSections);

        return new RJSRoot(
                rjsTrackSections.values(),
                netRelations.values(),
                rjsSwitches,
                rjsOperationalPoints,
                rjsTvdSections,
                rjsRoutes,
                rjsSpeedSections,
                new ArrayList<>(),
                new ArrayList<>());
    }

    private static Map<String, DescriptionLevel> parseDescriptionLevels(Document document) {
        var descLevels = new HashMap<String, DescriptionLevel>();
        for (var levelNode : document.selectNodes("/railML/infrastructure/topology/networks/network/level")) {
            var level = (Element) levelNode;
            var descriptionLevel = DescriptionLevel.getValue(level.attributeValue("descriptionLevel"));
            for (var networkResourceNode : level.selectNodes("networkResource")) {
                var networkResource = (Element) networkResourceNode;
                descLevels.put(networkResource.attributeValue("ref"), descriptionLevel);
            }
        }
        return descLevels;
    }
}
